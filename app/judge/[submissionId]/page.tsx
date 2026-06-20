import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getActiveEvent, getCriteria } from "@/lib/event";
import type { StoredFile } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreForm } from "@/components/judge/score-form";

export const dynamic = "force-dynamic";

export default async function JudgeScorePage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const judge = await requireRole("judge");
  const event = await getActiveEvent();

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      project: {
        include: {
          owner: { select: { name: true } },
          memberships: {
            where: { status: "approved" },
            include: { user: { select: { name: true } } },
          },
        },
      },
      scores: { where: { judgeId: judge.id } },
    },
  });
  if (!submission) notFound();

  // 分配校验
  const assignedCount = await prisma.judgeAssignment.count({
    where: { judgeId: judge.id },
  });
  if (assignedCount > 0) {
    const assigned = await prisma.judgeAssignment.findUnique({
      where: { judgeId_submissionId: { judgeId: judge.id, submissionId } },
    });
    if (!assigned) redirect("/judge");
  }

  const criteria = getCriteria(event);
  const myScore = submission.scores[0];
  const images = (submission.images as string[]) ?? [];
  const attachments = (submission.attachments as StoredFile[]) ?? [];
  const disabled = event?.phase !== "judging";

  return (
    <main className="container max-w-5xl py-10">
      <Link
        href="/judge"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 返回评审列表
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-5">
        {/* 作品全貌 */}
        <div className="space-y-6 lg:col-span-3">
          <div>
            <Badge variant="secondary">{submission.project.track}</Badge>
            <h1 className="mt-2 text-2xl font-bold">{submission.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              项目：{submission.project.title} · 发起人{" "}
              {submission.project.owner.name}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {submission.repoUrl && (
              <a className="text-primary hover:underline" href={submission.repoUrl} target="_blank" rel="noreferrer">代码仓库 ↗</a>
            )}
            {submission.demoUrl && (
              <a className="text-primary hover:underline" href={submission.demoUrl} target="_blank" rel="noreferrer">Demo ↗</a>
            )}
            {submission.videoUrl && (
              <a className="text-primary hover:underline" href={submission.videoUrl} target="_blank" rel="noreferrer">演示视频 ↗</a>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">作品介绍</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">
              {submission.summary}
            </p>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {images.map((url) => (
                <div key={url} className="relative h-44 overflow-hidden rounded-lg border">
                  <Image src={url} alt="" fill unoptimized className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">附件</h2>
              {attachments.map((f) => (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border bg-white px-3 py-2 text-sm hover:bg-accent"
                >
                  📎 {f.name}
                </a>
              ))}
            </div>
          )}

          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm font-medium">团队成员</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {submission.project.memberships.map((m) => (
                <Badge key={m.id} variant="outline">
                  {m.user.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 评分面板 */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">评分表</h2>
              <ScoreForm
                submissionId={submission.id}
                criteria={criteria}
                initialScores={(myScore?.scores as Record<string, number>) ?? {}}
                initialComment={myScore?.comment ?? ""}
                disabled={disabled}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
