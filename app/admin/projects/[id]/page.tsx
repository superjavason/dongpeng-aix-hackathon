import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, FileText, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseProjectDescription } from "@/lib/project-description";
import { MEMBERSHIP_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      event: { select: { name: true, phase: true } },
      owner: { select: { name: true, email: true } },
      memberships: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      submission: {
        select: {
          id: true,
          title: true,
          summary: true,
          repoUrl: true,
          demoUrl: true,
          videoUrl: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!project) notFound();

  const approved = project.memberships.filter((m) => m.status === "approved");
  const pending = project.memberships.filter((m) => m.status === "pending");
  const sections = parseProjectDescription(project.description);

  return (
    <main className="container py-8">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/projects">
          <ArrowLeft /> 返回项目管理
        </Link>
      </Button>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card className="rounded-3xl">
            <CardContent className="p-6">
              <Badge variant="secondary">{project.track}</Badge>
              <h1 className="mt-4 text-3xl font-bold">{project.title}</h1>
              <p className="mt-3 text-muted-foreground">{project.tagline}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <SectionTitle title="项目提报信息" desc="与项目广场详情、评委评分详情共用同一套项目描述解析逻辑。" />
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <article key={section.label} className="rounded-3xl border bg-white p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-red">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold">{section.label}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {section.helper}
                      </p>
                    </div>
                  </div>
                  <p
                    className={
                      section.muted
                        ? "mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground"
                        : "mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/90"
                    }
                  >
                    {section.content}
                  </p>
                </article>
              );
            })}
          </div>

          <Card className="rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-brand-red" />
                <h2 className="text-xl font-bold">作品信息</h2>
              </div>
              {project.submission ? (
                <div className="mt-5 space-y-3">
                  <h3 className="font-semibold">{project.submission.title}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {project.submission.summary}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {project.submission.repoUrl && (
                      <a className="text-brand-red hover:underline" href={project.submission.repoUrl} target="_blank" rel="noreferrer">
                        代码仓库
                      </a>
                    )}
                    {project.submission.demoUrl && (
                      <a className="text-brand-red hover:underline" href={project.submission.demoUrl} target="_blank" rel="noreferrer">
                        Demo
                      </a>
                    )}
                    {project.submission.videoUrl && (
                      <a className="text-brand-red hover:underline" href={project.submission.videoUrl} target="_blank" rel="noreferrer">
                        演示视频
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">该项目暂未提交作品。</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-3xl">
            <CardContent className="space-y-4 p-5">
              <InfoRow label="所属赛事" value={project.event.name} />
              <InfoRow label="发起人" value={`${project.owner.name} · ${project.owner.email}`} />
              <InfoRow label="队伍人数" value={`${approved.length}/${project.maxMembers}`} />
              <InfoRow label="待审核报名" value={`${pending.length}`} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-red" />
                <h2 className="font-bold">队伍成员</h2>
              </div>
              <div className="mt-4 space-y-3">
                {project.memberships.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{m.user.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                    </div>
                    {m.teamRole === "owner" ? (
                      <Badge variant="outline">
                        <Crown className="mr-1 h-3 w-3" /> 发起人
                      </Badge>
                    ) : (
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
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
