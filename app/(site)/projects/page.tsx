import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/lib/event";
import { getSessionUser } from "@/lib/session";
import { TRACKS, PHASE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProjectCard, type ProjectCardData } from "@/components/project/project-card";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; q?: string }>;
}) {
  const { track, q } = await searchParams;
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
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const cards: ProjectCardData[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    tagline: p.tagline,
    track: p.track,
    coverImageUrl: p.coverImageUrl,
    maxMembers: p.maxMembers,
    ownerName: p.owner.name,
    approvedCount: p.memberships.length,
  }));

  const canCreate =
    user?.role === "participant" && event?.phase === "registration";

  return (
    <main className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">项目广场</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            浏览所有提报项目，找到心仪的队伍报名加入
            {event && (
              <Badge variant="outline" className="ml-2">
                {PHASE_LABELS[event.phase]}
              </Badge>
            )}
          </p>
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
      <form className="mt-6 flex flex-wrap items-center gap-2" action="/projects">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="搜索项目名称或简介…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TrackChip current={track} value="all" label="全部" />
          {TRACKS.map((t) => (
            <TrackChip key={t} current={track} value={t} label={t} q={q} />
          ))}
        </div>
      </form>

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

function TrackChip({
  current,
  value,
  label,
  q,
}: {
  current?: string;
  value: string;
  label: string;
  q?: string;
}) {
  const active = (current ?? "all") === value;
  const params = new URLSearchParams();
  if (value !== "all") params.set("track", value);
  if (q) params.set("q", q);
  const href = `/projects${params.toString() ? `?${params}` : ""}`;
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          : "rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
      }
    >
      {label}
    </Link>
  );
}
