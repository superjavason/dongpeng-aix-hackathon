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
import { PHASE_FLOW_MAP, PHASE_LABELS, TRACKS, TRACK_DETAILS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RegistrationCountdown } from "@/components/layout/registration-countdown";

export const dynamic = "force-dynamic";

const TRACK_ICONS = [Briefcase, Sparkles, Layers, Palette];

const HOME_SCHEDULE = [
  ["7月18日 10:00", "全员启动会", "宣贯赛制、赛道、评审标准并启动报名"],
  ["7月13日-7月20日", "报名收集与确认", "收集报名信息，建立参赛台账"],
  ["7月20日-8月5日", "AI技术辅导", "分赛道开展技术与场景应用辅导"],
  ["8月10日", "初赛评审", "筛选 20-30 强，并选出 10 组进入决赛"],
  ["8月10日", "观众人气投票", "入围作品面向全集团线上投票"],
  ["9月中旬", "决赛暨成果展示", "现场路演、答辩、评奖"],
  ["9月下旬-10月", "成果沉淀与推广", "整理案例集，推动高价值项目试点"],
] as const;

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
        <div className="absolute inset-0 tech-hero-bg" />
        <div className="absolute inset-0 tech-circuit-grid" />
        <div className="absolute inset-0 tech-scan-lines" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 tech-data-field lg:block" />
        <div className="pointer-events-none absolute right-8 top-28 z-0 hidden opacity-20 md:block lg:hidden">
          <Image
            src="/logo2.png"
            alt=""
            width={170}
            height={170}
            className="h-auto w-auto object-contain drop-shadow-2xl"
          />
        </div>
        <div className="container relative z-10 grid max-w-6xl items-center gap-10 px-9 py-16 sm:px-10 md:py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-24">
          <div className="min-w-0 max-w-[35rem] animate-fade-up">
            <Badge className="bg-brand/90 hover:bg-brand">
              {event ? PHASE_LABELS[phase] : "敬请期待"}
            </Badge>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              AI+X黑客松大赛
            </h1>
            <p className="mt-5 text-2xl font-bold leading-tight text-brand sm:text-3xl lg:text-4xl">
              让 AI 走进业务场景，让创新真正落地
            </p>
            <RegistrationCountdown />
            <div className="mt-10 flex flex-wrap gap-3">
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
                <Link href="/about">了解赛事</Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-[34rem] grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-xl border border-white/15 bg-white/[0.06] shadow-2xl shadow-black/10 backdrop-blur-md sm:mt-12">
              <Stat value={projectCount} label="提报项目" />
              <Stat value={participantCount} label="参赛者" />
              <Stat value={submissionCount} label="提交作品" />
            </div>
          </div>

          <div className="relative hidden justify-center lg:flex">
            <div className="tech-logo-field relative flex h-80 w-80 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <div className="absolute inset-7 rounded-full bg-black/10 ring-1 ring-white/10" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <Image
                  src="/logo2.png"
                  alt="东鹏"
                  width={120}
                  height={120}
                  priority
                  className="h-auto w-auto object-contain drop-shadow-2xl"
                />
                <div className="mt-5 text-5xl font-black leading-none tracking-tight text-white">
                  AI+X
                </div>
                <div className="mt-2 text-xl font-bold text-brand">黑客松大赛</div>
                <div className="mt-3 h-px w-24 bg-white/30" />
                <div className="mt-3 text-xs font-medium tracking-[0.28em] text-white/60">
                  DONGPENG
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / 赛程 */}
      <section id="about" className="tech-section-grid relative overflow-hidden bg-white py-20">
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.24em] text-brand">
              PROCESS
            </p>
            <h2 className="mt-3 text-3xl font-bold">赛事流程</h2>
            <p className="mt-3 text-muted-foreground">
              从启动会到成果推广，七个关键节点逐步推进
            </p>
          </div>
          <div className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_SCHEDULE.map(([date, title, desc], i) => {
            const active = PHASE_FLOW_MAP[phase].flowItems.includes(title);
            return (
              <div
                key={title}
                className={`tech-card relative min-h-[190px] rounded-xl border p-5 transition ${
                  active
                    ? "border-brand/60 bg-white shadow-lg shadow-brand/10"
                    : "border-neutral-200 bg-white/90"
                }`}
              >
                <div
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-lg ${
                    active ? "bg-brand text-white" : "bg-neutral-100 text-brand"
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Phase {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-semibold text-brand">{date}</p>
                <p className="mt-1 font-semibold">{title}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {desc}
                </p>
                {active && (
                  <Badge className="absolute right-3 top-3">
                    {PHASE_LABELS[phase]}
                  </Badge>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </section>

      {/* 赛道 */}
      <section className="relative overflow-hidden bg-neutral-50 py-20">
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.24em] text-brand">
              TRACKS
            </p>
            <h2 className="mt-3 text-3xl font-bold">四大赛道</h2>
            <p className="mt-3 text-muted-foreground">
              围绕真实业务场景，推动 AI 应用从创意走向落地
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {TRACKS.map((t, i) => {
              const Icon = TRACK_ICONS[i % TRACK_ICONS.length];
              const detail = TRACK_DETAILS[t];
              return (
                <div
                  key={t}
                  className="tech-card group relative overflow-hidden rounded-xl border border-neutral-200 bg-white/95 p-6 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand transition group-hover:bg-brand group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold tracking-[0.2em] text-neutral-300">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">成果形式：</span>
                    {detail.output}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">作品要求：</span>
                    {detail.requirement}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 奖项 */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-neutral-50 to-transparent" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.24em] text-brand">
              AWARDS
            </p>
            <h2 className="mt-3 text-3xl font-bold">奖项设置</h2>
            <p className="mt-3 text-muted-foreground">
              获奖团队或个人将获得荣誉证书及奖金或等值礼品奖励
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "一等奖",
              q: "1组",
              d: "荣誉证书 + ¥10,000 等值礼品/团队激励",
              c: "from-amber-50 border-amber-200",
              m: "text-amber-500",
            },
            {
              t: "二等奖",
              q: "2组",
              d: "荣誉证书 + ¥5,000 等值礼品/组",
              c: "from-neutral-50 border-neutral-200",
              m: "text-neutral-400",
            },
            {
              t: "三等奖",
              q: "3组",
              d: "荣誉证书 + ¥3,000 等值礼品/组",
              c: "from-orange-50 border-orange-200",
              m: "text-amber-700",
            },
            {
              t: "入围奖",
              q: "20-30强",
              d: "荣誉证书 + ¥500 等值纪念礼品/组",
              c: "from-brand-50 border-brand-100",
              m: "text-brand",
            },
            {
              t: "总裁惊喜奖",
              q: "待定",
              d: "奖励内容待定，以最终评审及预算审批为准",
              c: "from-red-50 border-red-100",
              m: "text-brand",
            },
          ].map((p) => (
            <div
              key={p.t}
              className={`tech-card relative overflow-hidden rounded-xl border bg-gradient-to-b ${p.c} to-white p-6 text-center transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <Trophy className={`h-8 w-8 ${p.m}`} />
              </div>
              <h3 className="mt-4 text-2xl font-bold">{p.t}</h3>
              <p className="mt-1 text-sm font-semibold text-brand">{p.q}</p>
              <p className="mt-3 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-ink px-8 py-16 text-center text-white ring-1 ring-white/10">
          <div className="absolute inset-0 tech-hero-bg" />
          <div className="absolute inset-0 tech-circuit-grid opacity-70" />
          <div className="absolute inset-0 tech-scan-lines opacity-40" />
          <div className="absolute inset-y-0 right-0 hidden w-1/2 tech-data-field opacity-30 md:block" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">准备好你的 AI 创想了吗？</h2>
            <p className="mt-3 text-white/70">
              加入 AI+X黑客松大赛，让创意成为现实
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
    <div className="relative flex min-h-24 flex-col items-center justify-center px-3 text-center">
      <p className="tabular-nums text-4xl font-bold leading-none text-brand">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-white/60">{label}</p>
    </div>
  );
}
