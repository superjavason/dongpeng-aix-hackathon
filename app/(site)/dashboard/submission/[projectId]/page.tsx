import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { PHASE_LABELS } from "@/lib/constants";
import type { StoredFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  SubmissionForm,
  type SubmissionInitial,
} from "@/components/submission/submission-form";

export const dynamic = "force-dynamic";

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { memberships: true, submission: true },
  });
  if (!project) notFound();

  const isMember = project.memberships.some(
    (m) => m.userId === user.id && m.status === "approved"
  );
  if (!isMember) redirect("/dashboard");

  const event = await getActiveEvent();
  const phase = event?.phase ?? "draft";

  const initial: SubmissionInitial = {
    title: project.submission?.title ?? project.title,
    summary: project.submission?.summary ?? "",
    repoUrl: project.submission?.repoUrl ?? "",
    demoUrl: project.submission?.demoUrl ?? "",
    videoUrl: project.submission?.videoUrl ?? "",
    images: (project.submission?.images as string[] | undefined) ?? [],
    attachments:
      (project.submission?.attachments as StoredFile[] | undefined) ?? [],
  };

  const editable = phase === "in_progress";

  return (
    <main className="container max-w-2xl py-10">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 返回工作台
      </Link>
      <h1 className="mt-4 text-2xl font-bold">
        {editable ? "提交作品" : "作品详情"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{project.title}</p>

      {editable ? (
        <div className="mt-8">
          <SubmissionForm projectId={project.id} initial={initial} />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border bg-neutral-50 p-4 text-sm text-muted-foreground">
            当前赛事处于「{PHASE_LABELS[phase]}」阶段，作品已锁定，不可编辑。
          </div>
          {project.submission ? (
            <div className="space-y-3 rounded-xl border p-5">
              <h2 className="text-lg font-semibold">{project.submission.title}</h2>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {project.submission.summary}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                {project.submission.repoUrl && (
                  <a className="text-primary hover:underline" href={project.submission.repoUrl} target="_blank" rel="noreferrer">代码仓库 ↗</a>
                )}
                {project.submission.demoUrl && (
                  <a className="text-primary hover:underline" href={project.submission.demoUrl} target="_blank" rel="noreferrer">Demo ↗</a>
                )}
                {project.submission.videoUrl && (
                  <a className="text-primary hover:underline" href={project.submission.videoUrl} target="_blank" rel="noreferrer">演示视频 ↗</a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">该队伍未提交作品。</p>
          )}
          <Button asChild variant="outline">
            <Link href="/dashboard">返回工作台</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
