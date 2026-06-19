import { getSessionUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { prisma } from "@/lib/db";
import { projectSchema } from "@/lib/schemas";
import { can } from "@/lib/permissions";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const event = await getActiveEvent();
    if (!event) return fail("当前没有进行中的赛事", 400);

    if (!can("create_project", { phase: event.phase, role: user.role })) {
      return fail("当前赛事阶段不可提报项目", 403);
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "输入有误", 422);
    }
    const { title, tagline, description, track, maxMembers, coverImageUrl } =
      parsed.data;

    const project = await prisma.project.create({
      data: {
        eventId: event.id,
        ownerId: user.id,
        title,
        tagline,
        description,
        track,
        maxMembers,
        coverImageUrl: coverImageUrl || null,
        memberships: {
          create: {
            userId: user.id,
            status: "approved",
            teamRole: "owner",
          },
        },
      },
    });

    return ok({ id: project.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
