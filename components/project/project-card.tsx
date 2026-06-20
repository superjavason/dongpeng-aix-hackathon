import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ProjectCardData = {
  id: string;
  title: string;
  tagline: string;
  track: string;
  coverImageUrl: string | null;
  maxMembers: number;
  ownerName: string;
  approvedCount: number;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const full = project.approvedCount >= project.maxMembers;
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-brand-50 to-neutral-100">
        {project.coverImageUrl ? (
          <Image
            src={project.coverImageUrl}
            alt={project.title}
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-brand/20">
            AI+X
          </div>
        )}
        <Badge className="absolute left-3 top-3" variant="secondary">
          {project.track}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold">{project.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {project.tagline}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>发起人 · {project.ownerName}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {project.approvedCount}/{project.maxMembers}
            {full ? (
              <Badge variant="muted" className="ml-1">
                已满
              </Badge>
            ) : (
              <Badge variant="success" className="ml-1">
                招募中
              </Badge>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
