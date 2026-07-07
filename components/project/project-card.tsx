import Link from "next/link";
import Image from "next/image";
import {
  Bot,
  BrainCircuit,
  Code2,
  Database,
  Factory,
  FileText,
  Headphones,
  Heart,
  ImageIcon,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
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
  likeCount: number;
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
          <ProjectCover title={project.title} track={project.track} />
        )}
        <Badge className="absolute left-3 top-3" variant="secondary">
          {project.track}
        </Badge>
        {project.likeCount > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-xs font-medium text-white backdrop-blur">
            <Heart className="h-3 w-3 fill-current text-brand-red" />
            {project.likeCount}
          </span>
        )}
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
                已满员
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

type CoverConfig = {
  label: string;
  tone: string;
  icon: typeof Bot;
  accentIcon: typeof Sparkles;
};

function getCoverConfig(title: string, track: string): CoverConfig {
  const text = `${title}${track}`;

  if (text.includes("客服") || text.includes("售后") || text.includes("知识")) {
    return {
      label: "知识中枢",
      tone: "from-sky-950 via-slate-900 to-cyan-700",
      icon: Headphones,
      accentIcon: Database,
    };
  }

  if (text.includes("能耗") || text.includes("工厂") || text.includes("节能")) {
    return {
      label: "能耗优化",
      tone: "from-emerald-950 via-slate-900 to-lime-700",
      icon: Factory,
      accentIcon: Zap,
    };
  }

  if (text.includes("空间") || text.includes("瓷砖") || text.includes("排版")) {
    return {
      label: "空间生成",
      tone: "from-indigo-950 via-slate-900 to-rose-700",
      icon: LayoutGrid,
      accentIcon: ImageIcon,
    };
  }

  if (text.includes("导购") || text.includes("销售") || text.includes("话术")) {
    return {
      label: "业务教练",
      tone: "from-red-950 via-slate-900 to-orange-700",
      icon: MessageCircle,
      accentIcon: BrainCircuit,
    };
  }

  if (track.includes("编程")) {
    return {
      label: "智能开发",
      tone: "from-zinc-950 via-slate-900 to-blue-700",
      icon: Code2,
      accentIcon: Sparkles,
    };
  }

  if (track.includes("办公")) {
    return {
      label: "办公提效",
      tone: "from-slate-950 via-neutral-900 to-red-700",
      icon: FileText,
      accentIcon: BrainCircuit,
    };
  }

  if (track.includes("创意")) {
    return {
      label: "创意生成",
      tone: "from-fuchsia-950 via-slate-900 to-red-700",
      icon: ImageIcon,
      accentIcon: Sparkles,
    };
  }

  return {
    label: "智能应用",
    tone: "from-slate-950 via-slate-900 to-red-700",
    icon: Bot,
    accentIcon: BrainCircuit,
  };
}

function ProjectCover({ title, track }: { title: string; track: string }) {
  const config = getCoverConfig(title, track);
  const MainIcon = config.icon;
  const AccentIcon = config.accentIcon;

  return (
    <div className={`relative h-full overflow-hidden bg-gradient-to-br ${config.tone}`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45" />
      <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute right-5 top-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur">
        <MainIcon className="h-10 w-10" strokeWidth={1.8} />
      </div>
      <div className="absolute bottom-5 left-5 right-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
          <AccentIcon className="h-4 w-4 text-primary" />
          Project Visual
        </div>
        <div className="max-w-[12rem] text-2xl font-bold leading-tight text-white">
          {config.label}
        </div>
        <div className="mt-2 h-1 w-16 rounded-full bg-primary" />
      </div>
    </div>
  );
}
