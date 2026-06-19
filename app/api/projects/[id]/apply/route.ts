import { getSessionUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { prisma } from "@/lib/db";
import { applySchema } from "@/lib/schemas";
import { can } from "@/lib/permissions";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const event = await getActiveEvent();
    if (!event) return fail("当前没有进行中的赛事", 400);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        memberships: true,
      },
    });
    if (!project) return fail("项目不存在", 404);

    const existing = project.memberships.find((m) => m.userId === user.id);
    const isMember = !!existing;

    if (!can("apply", { phase: event.phase, role: user.role, isMember })) {
      if (isMember) return fail("你已报名或已是该项目成员", 409);
      return fail("当前赛事阶段不可报名", 403);
    }

    const approvedCount = project.memberships.filter(
      (m) => m.status === "approved"
    ).length;
    if (approvedCount >= project.maxMembers) {
      return fail("该项目人数已满", 409);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = applySchema.safeParse(body);
    const message = parsed.success ? parsed.data.message : undefined;

    await prisma.membership.create({
      data: {
        projectId: project.id,
        userId: user.id,
        status: "pending",
        teamRole: "member",
        message: message || null,
      },
    });

    return ok({ status: "pending" }, 201);
  } catch (e) {
    return handleError(e);
  }
}
