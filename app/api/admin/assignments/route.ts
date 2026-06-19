import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";

const schema = z.object({
  judgeId: z.string().min(1),
  submissionId: z.string().min(1),
  action: z.enum(["add", "remove"]),
});

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("参数有误", 422);
    const { judgeId, submissionId, action } = parsed.data;

    if (action === "remove") {
      await prisma.judgeAssignment.deleteMany({
        where: { judgeId, submissionId },
      });
      return ok({ assigned: false });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { project: { select: { eventId: true } } },
    });
    if (!submission) return fail("作品不存在", 404);

    await prisma.judgeAssignment.upsert({
      where: { judgeId_submissionId: { judgeId, submissionId } },
      create: {
        judgeId,
        submissionId,
        eventId: submission.project.eventId,
      },
      update: {},
    });
    return ok({ assigned: true });
  } catch (e) {
    return handleError(e);
  }
}
