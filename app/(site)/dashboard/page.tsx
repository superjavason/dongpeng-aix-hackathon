import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Crown,
  Inbox,
  Rocket,
  Trophy,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { getRankedSubmissions } from "@/lib/leaderboard";
import { PHASE_LABELS, MEMBERSHIP_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReviewActions } from "@/components/dashboard/review-actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const event = await getActiveEvent();
  const phase = event?.phase ?? "draft";

  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: sessionUser.id },
    include: {
      memberships: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      submission: { select: { id: true, updatedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const joined = await prisma.membership.findMany({
    where: { userId: sessionUser.id, teamRole: "member" },
    include: {
      project: {
        include: {
          owner: { select: { name: true } },
          submission: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const myProjectIds = new Set([
    ...ownedProjects.map((p) => p.id),
    ...joined
      .filter((m) => m.status === "approved")
      .map((m) => m.project.id),
  ]);
  const myResults =
    event?.resultsPublished
      ? (await getRankedSubmissions(event.id)).filter((r) =>
          myProjectIds.has(r.projectId)
        )
      : [];

  const approvedJoined = joined.filter((m) => m.status === "approved").length;
  const pendingReviews = ownedProjects.reduce(
    (total, project) =>
      total + project.memberships.filter((m) => m.status === "pending").length,
    0
  );
  const submittedCount = ownedProjects.filter((p) => p.submission).length;
  const canCreate = phase === "registration";

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
                Participant Desk
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                我的工作台
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
                欢迎，{sessionUser.name}。在这里管理项目提报、队伍报名、作品提交和赛事结果。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/25 backdrop-blur">
              <p className="text-sm text-white/55">当前赛事</p>
              <h2 className="mt-2 text-2xl font-bold">
                {event?.name ?? "AI+X黑客松大赛"}
              </h2>
              <Badge className="mt-5 bg-white/10 text-white hover:bg-white/10">
                {PHASE_LABELS[phase]}
              </Badge>
              <div className="mt-6 flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/projects">项目广场</Link>
                </Button>
                {canCreate && (
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/projects/new">提报项目</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container relative z-20 -mt-8 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Crown} label="我发起的项目" value={ownedProjects.length} />
          <StatCard icon={Users} label="我加入的队伍" value={approvedJoined} />
          <StatCard icon={Inbox} label="待审核报名" value={pendingReviews} />
          <StatCard icon={Rocket} label="已提交作品" value={submittedCount} />
        </div>

        {myResults.length > 0 && (
          <section className="mt-10">
            <SectionTitle
              icon={Trophy}
              title="我的成绩"
              desc="结果发布后，你参与项目的排名与平均分会在这里同步。"
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {myResults.map((r) => (
                <Card key={r.submissionId} className="rounded-3xl border-brand/30 shadow-xl shadow-black/5">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <Link
                        href={`/projects/${r.projectId}`}
                        className="font-medium hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        第 {r.rank} 名 · {r.scoreCount} 位评委评分
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-brand-red">
                        {r.average ?? "-"}
                      </p>
                      <Link
                        href="/leaderboard"
                        className="text-[11px] text-muted-foreground hover:underline"
                      >
                        查看排行榜 <ArrowRight className="inline h-3 w-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <SectionTitle
            icon={Crown}
            title="我发起的项目"
            desc="管理队伍报名、查看成员状态，并在比赛阶段提交或更新作品。"
          />

          {ownedProjects.length === 0 ? (
            <EmptyHint
              text={
                canCreate
                  ? "你还没有发起项目，可以先把想法提报出来。"
                  : "你当前没有发起的项目。"
              }
              action={
                canCreate
                  ? { href: "/projects/new", label: "去提报项目" }
                  : undefined
              }
            />
          ) : (
            <div className="mt-4 space-y-5">
              {ownedProjects.map((p) => {
                const approved = p.memberships.filter(
                  (m) => m.status === "approved"
                );
                const pending = p.memberships.filter(
                  (m) => m.status === "pending"
                );
                const canSubmit = phase === "in_progress";
                return (
                  <Card key={p.id} className="rounded-3xl shadow-xl shadow-black/5">
                    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-6">
                      <div>
                        <Badge variant="secondary">{p.track}</Badge>
                        <CardTitle className="mt-3 text-xl">
                          <Link href={`/projects/${p.id}`} className="hover:underline">
                            {p.title}
                          </Link>
                        </CardTitle>
                        <p className="mt-2 text-sm text-muted-foreground">
                          成员 {approved.length}/{p.maxMembers}
                          {p.submission ? " · 已提交作品" : " · 暂未提交作品"}
                        </p>
                      </div>
                      {canSubmit && (
                        <Button asChild size="sm">
                          <Link href={`/dashboard/submission/${p.id}`}>
                            <Rocket />
                            {p.submission ? "更新作品" : "提交作品"}
                          </Link>
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="rounded-2xl border bg-neutral-50/70 p-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Inbox className="h-4 w-4 text-brand-red" />
                          待审核报名
                          {pending.length > 0 && (
                            <Badge variant="warning" className="ml-1">
                              {pending.length}
                            </Badge>
                          )}
                        </div>
                        {pending.length === 0 ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            暂无待审核的报名。
                          </p>
                        ) : (
                          <ul className="mt-3 space-y-3">
                            {pending.map((m) => (
                              <li
                                key={m.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback>
                                      {m.user.name.slice(0, 1)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {m.user.name}
                                    </p>
                                    {m.message && (
                                      <p className="text-xs text-muted-foreground">
                                        {m.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {phase === "registration" ? (
                                  <ReviewActions membershipId={m.id} />
                                ) : (
                                  <Badge variant="muted">报名已截止</Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <SectionTitle
            icon={ClipboardList}
            title="我加入的队伍"
            desc="查看你的报名状态和已加入团队。"
          />
          {joined.length === 0 ? (
            <EmptyHint
              text="你还没有加入任何队伍，可以去项目广场看看正在招募的项目。"
              action={{ href: "/projects", label: "去项目广场看看" }}
            />
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {joined.map((m) => (
                <Card key={m.id} className="rounded-3xl shadow-xl shadow-black/5">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <Link
                        href={`/projects/${m.project.id}`}
                        className="font-medium hover:underline"
                      >
                        {m.project.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        发起人：{m.project.owner.name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        m.status === "approved"
                          ? "success"
                          : m.status === "pending"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {MEMBERSHIP_LABELS[m.status]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Crown;
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

function SectionTitle({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Crown;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-red">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function EmptyHint({
  text,
  action,
}: {
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-4 rounded-3xl border border-dashed bg-neutral-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-red shadow-sm">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      {action && (
        <Button asChild variant="outline" className="mt-4">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
