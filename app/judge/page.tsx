import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Gavel,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { PHASE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      project: { select: { title: true, track: true, tagline: true } },
      scores: { where: { judgeId: judge.id }, select: { total: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const scoredCount = submissions.filter((s) => s.scores.length > 0).length;
  const total = submissions.length;
  const pendingCount = total - scoredCount;
  const pct = total > 0 ? Math.round((scoredCount / total) * 100) : 0;
  const open = event.phase === "judging";

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="absolute inset-0 tech-hero-bg" />
        <div className="absolute inset-0 tech-circuit-grid" />
        <div className="absolute inset-0 tech-scan-lines" />

        <div className="container relative z-10 py-12 lg:py-16">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-brand-red">
                Judge Console
              </p>
              <h1 className="mt-4 flex items-center gap-3 text-4xl font-black leading-tight sm:text-5xl">
                <Gavel className="h-10 w-10 text-brand-red" />
                作品评审
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                你好，{judge.name}。请结合项目提报信息、作品材料和评分细则完成评审。
              </p>
              {assignedIds.length > 0 && (
                <Badge className="mt-6 bg-white/10 text-white hover:bg-white/10">
                  仅显示分配给你的作品
                </Badge>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/25 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/55">评审进度</p>
                  <p className="mt-2 text-4xl font-black">
                    {scoredCount}/{total}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-brand-red">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-brand-red transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-white/60">
                {event.name} · {PHASE_LABELS[event.phase]}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container relative z-20 -mt-8 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={ShieldCheck} label="可评作品" value={total} />
          <StatCard icon={CheckCircle2} label="已评作品" value={scoredCount} />
          <StatCard icon={Circle} label="待评作品" value={pendingCount} />
        </div>

        {!open && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            当前赛事处于「{PHASE_LABELS[event.phase]}」阶段，评分通道
            {event.phase === "ended" ? "已关闭" : "尚未开放"}，你可以先浏览作品材料。
          </div>
        )}

        {total === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed bg-neutral-50 p-10 text-center text-muted-foreground">
            暂无可评审的作品
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {submissions.map((s) => {
              const scored = s.scores.length > 0;
              return (
                <Link key={s.id} href={`/judge/${s.id}`}>
                  <Card className="h-full rounded-3xl transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Badge variant="secondary">{s.project.track}</Badge>
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
                      </div>
                      <h2 className="mt-4 text-xl font-bold">{s.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        项目：{s.project.title}
                      </p>
                      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                        {s.project.tagline}
                      </p>
                      <div className="mt-5 flex items-center text-sm font-medium text-brand-red">
                        进入评审 <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gavel;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-xl shadow-black/5">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-red">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-3xl font-black text-brand-red">{value}</p>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
