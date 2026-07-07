import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { eventUpdateSchema } from "@/lib/schemas";
import { computeTotal } from "@/lib/scoring";
import { ok, fail, handleError } from "@/lib/api";
import type { Criterion } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);

    const { id } = await params;
    const parsed = eventUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "参数有误", 422);
    }
    const data = parsed.data;

    // 若评分维度变更，则按新维度重算所有已存在评分的总分，保证一致性。
    if (data.scoreCriteria) {
      const criteria = data.scoreCriteria as Criterion[];
      const submissions = await prisma.submission.findMany({
        where: { project: { eventId: id } },
        select: { id: true },
      });
      const subIds = submissions.map((s) => s.id);
      const scores = await prisma.score.findMany({
        where: { submissionId: { in: subIds } },
      });
      await prisma.$transaction(
        scores.map((s) =>
          prisma.score.update({
            where: { id: s.id },
            data: {
              total: computeTotal(
                s.scores as Record<string, number>,
                criteria
              ),
            },
          })
        )
      );
    }

    // 单活跃不变式：设为活跃时，先取消其余所有赛事的 isActive。原子化处理，避免中途失败导致零活跃赛事。
    const event = await prisma.$transaction(async (tx) => {
      if (data.isActive === true) {
        await tx.event.updateMany({
          where: { id: { not: id }, isActive: true },
          data: { isActive: false },
        });
      }
      return tx.event.update({ where: { id }, data });
    });
    return ok({ id: event.id, phase: event.phase });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);

    const { id } = await params;
    const projectCount = await prisma.project.count({ where: { eventId: id } });
    if (projectCount > 0) {
      return fail("该赛事下仍有项目，无法删除。请先清空项目。", 422);
    }
    await prisma.event.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
}
