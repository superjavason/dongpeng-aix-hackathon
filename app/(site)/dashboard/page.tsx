import Link from "next/link";
import { Crown, Inbox, Rocket, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
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

  return (
    <main className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">我的工作台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            欢迎，{sessionUser.name}
          </p>
        </div>
        {event && (
          <Badge variant="outline" className="text-sm">
            {event.name} · {PHASE_LABELS[phase]}
          </Badge>
        )}
      </div>

      {/* 我发起的项目 */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Crown className="h-5 w-5 text-brand" /> 我发起的项目
        </h2>

        {ownedProjects.length === 0 ? (
          <EmptyHint
            text={
              phase === "registration"
                ? "你还没有发起项目"
                : "你没有发起的项目"
            }
            action={
              phase === "registration"
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
                <Card key={p.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle>
                        <Link href={`/projects/${p.id}`} className="hover:underline">
                          {p.title}
                        </Link>
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {p.track} · 成员 {approved.length}/{p.maxMembers}
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
                  <CardContent>
                    {/* 待审报名 */}
                    <div className="rounded-lg border bg-neutral-50/60 p-4">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        <Inbox className="h-4 w-4" />
                        待审核报名
                        {pending.length > 0 && (
                          <Badge variant="warning" className="ml-1">
                            {pending.length}
                          </Badge>
                        )}
                      </p>
                      {pending.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          暂无待审核的报名
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {pending.map((m) => (
                            <li
                              key={m.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white p-3"
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

      {/* 我加入的队伍 */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardList className="h-5 w-5 text-brand" /> 我加入的队伍
        </h2>
        {joined.length === 0 ? (
          <EmptyHint
            text="你还没有加入任何队伍"
            action={{ href: "/projects", label: "去项目广场看看" }}
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {joined.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <Link
                      href={`/projects/${m.project.id}`}
                      className="font-medium hover:underline"
                    >
                      {m.project.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      发起人 {m.project.owner.name}
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
    </main>
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
    <div className="mt-4 rounded-xl border border-dashed bg-neutral-50 p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {action && (
        <Button asChild variant="outline" className="mt-3">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
