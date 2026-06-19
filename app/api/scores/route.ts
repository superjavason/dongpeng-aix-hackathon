import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { getActiveEvent, getCriteria } from "@/lib/event";
import { prisma } from "@/lib/db";
import { scoreSchema } from "@/lib/schemas";
import { can } from "@/lib/permissions";
import { computeTotal } from "@/lib/scoring";
import { ok, fail, handleError } from "@/lib/api";

const bodySchema = scoreSchema.extend({ submissionId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const event = await getActiveEvent();
    const phase = event?.phase ?? "draft";

    if (!can("score", { phase, role: user.role })) {
      return fail("当前不可打分（需评委身份且处于评分阶段）", 403);
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "输入有误", 422);
    }
    const { submissionId, scores, comment } = parsed.data;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) return fail("作品不存在", 404);

    // 若该评委存在分配，则只能评被分配的作品
    const assignedCount = await prisma.judgeAssignment.count({
      where: { judgeId: user.id },
    });
    if (assignedCount > 0) {
      const assigned = await prisma.judgeAssignment.findUnique({
        where: {
          judgeId_submissionId: { judgeId: user.id, submissionId },
        },
      });
      if (!assigned) return fail("该作品未分配给你评审", 403);
    }

    const criteria = getCriteria(event);
    // 校验每个维度不超过满分
    for (const c of criteria) {
      const v = scores[c.key];
      if (v !== undefined && (v < 0 || v > c.max)) {
        return fail(`「${c.label}」分数需在 0-${c.max} 之间`, 422);
      }
    }

    const total = computeTotal(scores, criteria);

    await prisma.score.upsert({
      where: {
        submissionId_judgeId: { submissionId, judgeId: user.id },
      },
      create: { submissionId, judgeId: user.id, scores, total, comment: comment || null },
      update: { scores, total, comment: comment || null },
    });

    return ok({ total });
  } catch (e) {
    return handleError(e);
  }
}
