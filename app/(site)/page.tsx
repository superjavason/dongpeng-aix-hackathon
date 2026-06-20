import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Factory,
  TrendingUp,
  Palette,
  Briefcase,
  Sparkles,
  Layers,
  Trophy,
  Calendar,
  Users,
  Rocket,
  Gavel,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/lib/event";
import { PHASE_LABELS, PHASE_ORDER, TRACKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const TRACK_ICONS = [Factory, TrendingUp, Palette, Briefcase, Sparkles, Layers];

const PHASE_DESC: Record<string, string> = {
  draft: "赛事筹备，敬请期待",
  registration: "提报项目、自由组队、报名加入",
  in_progress: "团队开发，提交参赛作品",
  judging: "专业评委多维度评审",
  ended: "公布成绩，共赏佳作",
};

export default async function Home() {
  const event = await getActiveEvent();
  const [projectCount, participantCount, submissionCount] = await Promise.all([
    event ? prisma.project.count({ where: { eventId: event.id } }) : 0,
    prisma.user.count({ where: { role: "participant" } }),
    event
      ? prisma.submission.count({ where: { project: { eventId: event.id } } })
      : 0,
  ]);

  const phase = event?.phase ?? "draft";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="absolute inset-0 brand-gradient opacity-70" />
        <div className="absolute inset-0 grid-pattern opacity-[0.08]" />
        <div className="container relative z-10 grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <Badge className="bg-brand/90 hover:bg-brand">
              {event ? PHASE_LABELS[phase] : "敬请期待"}
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              用 AI 重塑
              <br />
              <span className="text-brand">科技 · 艺术 · 生活</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/70">
              {event?.description ??
                "东鹏 AI+X 黑客松，邀你以人工智能重塑制造、营销、设计与体验。提报创意，组建团队，让想法落地。"}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {phase === "registration" ? (
                <Button size="lg" asChild>
                  <Link href="/projects/new">
                    提报项目 <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link href="/projects">
                    浏览项目 <ArrowRight />
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#about">了解赛事</Link>
              </Button>
            </div>

            <div className="mt-12 flex gap-10">
              <Stat value={projectCount} label="提报项目" />
              <Stat value={participantCount} label="参赛者" />
              <Stat value={submissionCount} label="提交作品" />
            </div>
          </div>

          <div className="relative hidden justify-center lg:flex">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <div className="absolute inset-6 rounded-full bg-white/5 ring-1 ring-white/10" />
              <Image
                src="/logo2.png"
                alt="东鹏"
                width={180}
                height={180}
                priority
                className="relative z-10 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About / 赛程 */}
      <section id="about" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">赛事流程</h2>
          <p className="mt-3 text-muted-foreground">
            从提报到颁奖，五个阶段一站式完成
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {PHASE_ORDER.map((p, i) => {
            const active = p === phase;
            const Icon = [Calendar, Users, Rocket, Gavel, Trophy][i];
            return (
              <div
                key={p}
                className={`relative rounded-xl border p-5 transition ${
                  active ? "border-brand bg-brand-50" : "bg-white"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    active ? "bg-brand text-white" : "bg-neutral-100 text-brand"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  阶段 {i + 1}
                </p>
                <p className="font-semibold">{PHASE_LABELS[p]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {PHASE_DESC[p]}
                </p>
                {active && (
                  <Badge className="absolute right-3 top-3">进行中</Badge>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 赛道 */}
      <section className="bg-neutral-50 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">六大赛道</h2>
            <p className="mt-3 text-muted-foreground">
              AI + X，X 是无限可能
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((t, i) => {
              const Icon = TRACK_ICONS[i % TRACK_ICONS.length];
              return (
                <div
                  key={t}
                  className="group rounded-xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand transition group-hover:bg-brand group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    用 AI 重新定义{t.replace("AI + ", "")}的边界
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 奖项 */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">奖项设置</h2>
          <p className="mt-3 text-muted-foreground">荣誉与奖金，致敬每一个创想</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { t: "一等奖", d: "¥50,000 + 落地孵化资源", c: "from-amber-50 border-amber-200", m: "text-amber-500" },
            { t: "二等奖", d: "¥20,000 + 技术专家辅导", c: "from-neutral-50 border-neutral-200", m: "text-neutral-400" },
            { t: "三等奖", d: "¥10,000 + 荣誉证书", c: "from-orange-50 border-orange-200", m: "text-amber-700" },
          ].map((p) => (
            <div
              key={p.t}
              className={`rounded-2xl border bg-gradient-to-b ${p.c} to-white p-8 text-center`}
            >
              <Trophy className={`mx-auto h-10 w-10 ${p.m}`} />
              <h3 className="mt-4 text-2xl font-bold">{p.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-ink px-8 py-16 text-center text-white">
          <div className="absolute inset-0 brand-gradient opacity-60" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">准备好你的 AI 创想了吗？</h2>
            <p className="mt-3 text-white/70">
              加入东鹏 AI+X 黑客松，让创意成为现实
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href="/projects">
                立即参与 <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-brand">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}
