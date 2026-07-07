import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/lib/event";
import { getSessionUser } from "@/lib/session";
import { PHASE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectCard, type ProjectCardData } from "@/components/project/project-card";
import { ProjectFilters } from "@/components/project/project-filters";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; q?: string; status?: string }>;
}) {
  const { track, q, status } = await searchParams;
  const event = await getActiveEvent();
  const user = await getSessionUser();

  const projects = event
    ? await prisma.project.findMany({
        where: {
          eventId: event.id,
          ...(track && track !== "all" ? { track } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { tagline: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          owner: { select: { name: true } },
          memberships: { where: { status: "approved" }, select: { id: true } },
          _count: { select: { likes: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const filteredProjects = projects.filter((p) => {
    const approvedCount = p.memberships.length;
    const full = approvedCount >= p.maxMembers;
    if (status === "recruiting") return !full;
    if (status === "full") return full;
    return true;
  });

  const cards: ProjectCardData[] = filteredProjects.map((p) => ({
    id: p.id,
    title: p.title,
    tagline: p.tagline,
    track: p.track,
    coverImageUrl: p.coverImageUrl,
    maxMembers: p.maxMembers,
    ownerName: p.owner.name,
    approvedCount: p.memberships.length,
    likeCount: p._count.likes,
  }));

  const canCreate =
    user?.role === "participant" && event?.phase === "registration";

  return (
    <main className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">项目广场</h1>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            浏览所有提报项目，找到心仪的队伍报名加入
            {event && (
              <Badge variant="outline" className="ml-2">
                {PHASE_LABELS[event.phase]}
              </Badge>
            )}
          </div>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus /> 提报项目
            </Link>
          </Button>
        )}
      </div>

      {/* 筛选 */}
      <ProjectFilters q={q} track={track} status={status} />

      {/* 列表 */}
      {cards.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">
          暂无符合条件的项目
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <ProjectCard key={c.id} project={c} />
          ))}
        </div>
      )}
    </main>
  );
}
