import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Crown,
  ImageIcon,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/lib/event";
import { getSessionUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PHASE_LABELS } from "@/lib/constants";
import { parseProjectDescription } from "@/lib/project-description";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ApplyButton } from "@/components/project/apply-button";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, event, user] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        memberships: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
        submission: { select: { id: true } },
      },
    }),
    getActiveEvent(),
    getSessionUser(),
  ]);

  if (!project) notFound();

  const approved = project.memberships.filter((m) => m.status === "approved");
  const pendingCount = project.memberships.filter(
    (m) => m.status === "pending"
  ).length;
  const full = approved.length >= project.maxMembers;
  const phase = event?.phase ?? "draft";
  const detailSections = parseProjectDescription(project.description);

  const myMembership = user
    ? project.memberships.find((m) => m.userId === user.id)
    : undefined;
  const isOwner = user?.id === project.ownerId;
  const isMember = !!myMembership;

  const showApply =
    !!user &&
    can("apply", { phase, role: user.role, isMember }) &&
    !full;

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="absolute inset-0 tech-hero-bg" />
        <div className="absolute inset-0 tech-circuit-grid" />
        <div className="absolute inset-0 tech-scan-lines" />

        <div className="container relative z-10 py-10 lg:py-14">
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/projects">
              <ArrowLeft /> 返回项目广场
            </Link>
          </Button>

          <div className="mt-10 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <Badge className="bg-white/10 text-white hover:bg-white/10">
                {project.track}
              </Badge>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                {project.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
                {project.tagline}
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm text-white/70">
                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                  发起人：{project.owner.name}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                  队伍人数：{approved.length}/{project.maxMembers}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                  {full ? "已满员" : "招募中"}
                </span>
              </div>
            </div>

            <div className="relative h-56 overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-black/30">
              {project.coverImageUrl ? (
                <Image
                  src={project.coverImageUrl}
                  alt={project.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-900">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-50" />
                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative flex items-center gap-4 text-white">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                        Project
                      </p>
                      <p className="mt-2 text-2xl font-bold">AI+X</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container relative z-20 -mt-8 pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {detailSections.map((section) => {
              const Icon = section.icon;
              return (
                <article
                  key={section.label}
                  className="rounded-3xl border bg-white p-6 shadow-xl shadow-black/5 sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-red">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-red">
                        {section.label}
                      </p>
                      {section.helper && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {section.helper}
                        </p>
                      )}
                    </div>
                  </div>
                  <p
                    className={
                      section.muted
                        ? "mt-5 whitespace-pre-wrap text-base leading-8 text-muted-foreground"
                        : "mt-5 whitespace-pre-wrap text-base leading-8 text-foreground/90"
                    }
                  >
                    {section.content}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card className="rounded-3xl shadow-xl shadow-black/5">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">赛事阶段</span>
                  <Badge variant="outline">{PHASE_LABELS[phase]}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" /> 队伍人数
                  </span>
                  <span className="font-medium">
                    {approved.length}/{project.maxMembers}
                    {full ? (
                      <Badge variant="muted" className="ml-2">
                        已满员
                      </Badge>
                    ) : (
                      <Badge variant="success" className="ml-2">
                        招募中
                      </Badge>
                    )}
                  </span>
                </div>

                <div className="border-t pt-4">
                  {!user && (
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/login?callbackUrl=/projects/${project.id}`}>
                        登录后报名
                      </Link>
                    </Button>
                  )}
                  {isOwner && (
                    <div className="space-y-2">
                      <Badge className="w-full justify-center py-1.5">
                        <Crown className="mr-1 h-3.5 w-3.5" /> 你是发起人
                      </Badge>
                      {pendingCount > 0 && (
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/dashboard">
                            {pendingCount} 份报名待审核
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                  {!isOwner && myMembership?.status === "approved" && (
                    <Badge variant="success" className="w-full justify-center py-1.5">
                      你已加入该队伍
                    </Badge>
                  )}
                  {!isOwner && myMembership?.status === "pending" && (
                    <Badge variant="warning" className="w-full justify-center py-1.5">
                      <Clock className="mr-1 h-3.5 w-3.5" /> 报名审核中
                    </Badge>
                  )}
                  {!isOwner && myMembership?.status === "rejected" && (
                    <Badge variant="muted" className="w-full justify-center py-1.5">
                      报名未通过
                    </Badge>
                  )}
                  {showApply && <ApplyButton projectId={project.id} />}
                  {user && !isMember && !showApply && phase !== "registration" && (
                    <p className="text-center text-sm text-muted-foreground">
                      报名通道已关闭
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-xl shadow-black/5">
              <CardContent className="p-5">
                <h3 className="mb-3 text-sm font-semibold">队伍成员</h3>
                <div className="space-y-3">
                  {approved.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{m.user.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{m.user.name}</span>
                      {m.teamRole === "owner" && (
                        <Badge variant="outline" className="ml-auto">
                          <Crown className="mr-1 h-3 w-3" /> 发起人
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
