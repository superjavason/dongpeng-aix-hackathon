import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";

/** 校验目标项目是否可被当前用户点赞，返回项目信息或错误响应。 */
async function loadLikableProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      eventId: true,
      ownerId: true,
      event: { select: { maxLikesPerUser: true } },
      memberships: {
        where: { userId, status: "approved" },
        select: { id: true },
      },
    },
  });
  if (!project) return { error: fail("项目不存在", 404) } as const;

  const isOwner = project.ownerId === userId;
  const isApprovedMember = project.memberships.length > 0;
  if (isOwner || isApprovedMember) {
    return { error: fail("不能给自己参与的项目点赞", 403) } as const;
  }
  return { project } as const;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const loaded = await loadLikableProject(id, user.id);
    if ("error" in loaded) return loaded.error;
    const { project } = loaded;

    const max = project.event.maxLikesPerUser;

    // 事务内先计数再创建，避免超额。@@unique 保证不重复点同一项目。
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.projectLike.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: project.id } },
        select: { id: true },
      });
      if (existing) return { already: true as const };

      const used = await tx.projectLike.count({
        where: { eventId: project.eventId, userId: user.id },
      });
      if (used >= max) return { exhausted: true as const, used };

      await tx.projectLike.create({
        data: {
          eventId: project.eventId,
          projectId: project.id,
          userId: user.id,
        },
      });
      return { created: true as const, used: used + 1 };
    });

    if ("exhausted" in result) {
      return fail(`点赞额度已用尽（每场赛事最多 ${max} 票）`, 409);
    }

    const [likeCount, used] = await Promise.all([
      prisma.projectLike.count({ where: { projectId: project.id } }),
      prisma.projectLike.count({
        where: { eventId: project.eventId, userId: user.id },
      }),
    ]);

    return ok({ liked: true, likeCount, remaining: Math.max(0, max - used) });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, eventId: true, event: { select: { maxLikesPerUser: true } } },
    });
    if (!project) return fail("项目不存在", 404);

    await prisma.projectLike
      .delete({
        where: { userId_projectId: { userId: user.id, projectId: project.id } },
      })
      .catch(() => null); // 未点赞时忽略

    const max = project.event.maxLikesPerUser;
    const [likeCount, used] = await Promise.all([
      prisma.projectLike.count({ where: { projectId: project.id } }),
      prisma.projectLike.count({
        where: { eventId: project.eventId, userId: user.id },
      }),
    ]);

    return ok({ liked: false, likeCount, remaining: Math.max(0, max - used) });
  } catch (e) {
    return handleError(e);
  }
}
