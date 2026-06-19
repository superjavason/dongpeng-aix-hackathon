import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Users, Crown, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/lib/event";
import { getSessionUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PHASE_LABELS } from "@/lib/constants";
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
    <main className="container py-10">
      <Link
        href="/projects"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← 返回项目广场
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {/* 主体 */}
        <div className="lg:col-span-2">
          <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-neutral-100">
            {project.coverImageUrl ? (
              <Image
                src={project.coverImageUrl}
                alt={project.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl font-bold text-brand/20">
                AI+X
              </div>
            )}
          </div>

          <div className="mt-6">
            <Badge variant="secondary">{project.track}</Badge>
            <h1 className="mt-3 text-3xl font-bold">{project.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {project.tagline}
            </p>
          </div>

          <div className="prose prose-neutral mt-8 max-w-none">
            <h2 className="text-lg font-semibold">项目介绍</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground/90">
              {project.description}
            </p>
          </div>
        </div>

        {/* 侧栏 */}
        <div className="space-y-4">
          <Card>
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
                      已满
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

          {/* 成员 */}
          <Card>
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
    </main>
  );
}
