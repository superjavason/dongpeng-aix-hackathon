import { getSessionUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/schemas";
import { can } from "@/lib/permissions";
import { ok, fail, handleError } from "@/lib/api";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        project: { include: { memberships: true } },
      },
    });
    if (!membership) return fail("报名记录不存在", 404);

    const isOwner = membership.project.ownerId === user.id;
    const event = await getActiveEvent();
    const phase = event?.phase ?? "draft";

    if (!can("review_application", { phase, role: user.role, isOwner })) {
      return fail("无权审核或当前阶段不可审核", 403);
    }
    if (membership.status !== "pending") {
      return fail("该报名已处理", 409);
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return fail("参数有误", 422);
    const { status } = parsed.data;

    if (status === "approved") {
      const approvedCount = membership.project.memberships.filter(
        (m) => m.status === "approved"
      ).length;
      if (approvedCount >= membership.project.maxMembers) {
        return fail("队伍人数已满，无法通过", 409);
      }
    }

    await prisma.membership.update({
      where: { id },
      data: { status },
    });

    return ok({ status });
  } catch (e) {
    return handleError(e);
  }
}
