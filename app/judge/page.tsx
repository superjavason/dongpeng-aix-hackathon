import Link from "next/link";
import { CheckCircle2, Circle, Gavel } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { PHASE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function JudgeHome() {
  const judge = await requireRole("judge");
  const event = await getActiveEvent();

  if (!event) {
    return (
      <main className="container py-10">
        <p className="text-muted-foreground">当前没有进行中的赛事。</p>
      </main>
    );
  }

  const assignments = await prisma.judgeAssignment.findMany({
    where: { judgeId: judge.id },
    select: { submissionId: true },
  });
  const assignedIds = assignments.map((a) => a.submissionId);

  const submissions = await prisma.submission.findMany({
    where: {
      project: { eventId: event.id },
      ...(assignedIds.length > 0 ? { id: { in: assignedIds } } : {}),
    },
    include: {
      project: { select: { title: true, track: true } },
      scores: { where: { judgeId: judge.id }, select: { total: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const scoredCount = submissions.filter((s) => s.scores.length > 0).length;
  const total = submissions.length;
  const pct = total > 0 ? Math.round((scoredCount / total) * 100) : 0;
  const open = event.phase === "judging";

  return (
    <main className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Gavel className="h-6 w-6 text-brand" /> 作品评审
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.name} · {PHASE_LABELS[event.phase]}
            {assignedIds.length > 0 && " · 仅显示分配给你的作品"}
          </p>
        </div>
        <Card className="min-w-[220px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">评审进度</span>
              <span className="font-semibold">
                {scoredCount}/{total}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {!open && (
        <div className="mt-6 rounded-lg border bg-amber-50 p-4 text-sm text-amber-800">
          当前赛事处于「{PHASE_LABELS[event.phase]}」阶段，评分通道
          {event.phase === "ended" ? "已关闭" : "尚未开放"}，你可以先浏览作品。
        </div>
      )}

      {total === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">暂无可评审的作品</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {submissions.map((s) => {
            const scored = s.scores.length > 0;
            return (
              <Link key={s.id} href={`/judge/${s.id}`}>
                <Card className="transition hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.project.title} · {s.project.track}
                      </p>
                    </div>
                    {scored ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        已评 {s.scores[0].total}
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="gap-1">
                        <Circle className="h-3.5 w-3.5" /> 待评
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
