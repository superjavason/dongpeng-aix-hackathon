import { getSessionUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { prisma } from "@/lib/db";
import { submissionSchema } from "@/lib/schemas";
import { can } from "@/lib/permissions";
import { ok, fail, handleError } from "@/lib/api";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const project = await prisma.project.findUnique({
      where: { id },
      include: { memberships: true },
    });
    if (!project) return fail("项目不存在", 404);

    const isMember = project.memberships.some(
      (m) => m.userId === user.id && m.status === "approved"
    );

    const event = await getActiveEvent();
    const phase = event?.phase ?? "draft";

    if (!can("submit_work", { phase, role: user.role, isMember })) {
      if (!isMember) return fail("只有队伍成员可提交作品", 403);
      return fail("当前赛事阶段不可提交作品", 403);
    }

    const body = await req.json();
    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "输入有误", 422);
    }
    const d = parsed.data;

    const data = {
      title: d.title,
      summary: d.summary,
      repoUrl: d.repoUrl || null,
      demoUrl: d.demoUrl || null,
      videoUrl: d.videoUrl || null,
      images: d.images,
      attachments: d.attachments,
    };

    await prisma.submission.upsert({
      where: { projectId: project.id },
      create: { projectId: project.id, ...data },
      update: data,
    });

    return ok({ saved: true });
  } catch (e) {
    return handleError(e);
  }
}
