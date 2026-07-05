import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileText,
  ImageIcon,
  ListChecks,
  Sparkles,
  Target,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { TRACKS, TRACK_DETAILS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RegistrationCountdown } from "@/components/layout/registration-countdown";

const backgroundPoints = [
  "随着人工智能技术加速演进，从生成式 AI 到具备自主规划与执行能力的智能体系统不断突破，AI 正从辅助工具逐步进化为能够自主完成复杂任务的数字员工。",
  "为推动 AI 在东鹏集团各业务场景中的应用落地，提升员工 AI 应用能力，挖掘优秀创新案例，结合集团 54 周年厂庆活动，特举办 AI+X黑客松大赛。",
  "本次活动以“普及 AI、应用 AI、创造价值”为核心导向，通过培训赋能、实战应用、成果展示相结合的方式，为集团数字化转型和经营提效提供创新动力。",
];

const backgroundKeywords = [
  ["普及 AI", "降低员工使用 AI 的门槛"],
  ["应用 AI", "推动 AI 进入真实业务场景"],
  ["创造价值", "形成可复制、可推广的创新案例"],
];

const schedule = [
  ["7月18日 周六 10:00", "全员启动会", "宣贯大赛规则，启动报名，发布赛制、赛道、评审标准与报名入口"],
  ["7月13日-7月20日", "报名收集与参赛确认", "确认参赛资格，按赛道建立参赛台账"],
  ["7月20日-8月5日", "AI技术辅导", "分赛道开展技术与场景应用辅导，7月下旬与8月中旬安排现场辅导"],
  ["8月10日", "初赛评审", "对作品材料进行评审，筛选 20-30 强，并选出 10 组进入决赛"],
  ["8月10日", "观众人气投票", "入围作品推广至全集团线上投票，按排名折算人气得分"],
  ["9月中旬", "决赛暨成果展示", "现场路演、答辩、评奖"],
  ["9月下旬-10月", "成果沉淀与推广", "整理优秀案例，推动高价值项目试点"],
];

const scoreComposition = [
  ["专家评审", "80%", "专家按 100 分制评分，最终乘以 80%计入总分。"],
  ["观众人气", "20%", "按投票排名折算为 20 分制，体现员工侧关注度与传播力。"],
];

const expertCriteria = [
  ["业务价值", "30分", "问题真实性10分、效率提升度15分、战略契合度5分。"],
  ["方案质量", "25分", "创新性10分、技术合理性10分、安全合规性5分。"],
  ["落地成效", "30分", "完成度10分、实际使用情况15分、稳定可用性5分。"],
  ["推广潜力", "15分", "可复制性8分、投入产出比4分、呈现与文档3分。"],
];

const popularityRules = [
  ["排名前20%", "20分"],
  ["排名20%-40%", "16分"],
  ["排名40%-60%", "12分"],
  ["排名60%-80%", "8分"],
  ["其余入围作品", "4分"],
  ["未按要求提交展示材料或未参与投票展示", "0分"],
];

const awards = [
  ["一等奖", "1组", "荣誉证书 + 10,000元等值礼品/团队激励；获奖小组有机会获得晋升机会"],
  ["二等奖", "2组", "荣誉证书 + 5,000元等值礼品/组"],
  ["三等奖", "3组", "荣誉证书 + 3,000元等值礼品/组"],
  ["入围奖", "20-30强", "荣誉证书 + 500元等值纪念礼品/组，具体数量视最终入围组别而定"],
  ["总裁惊喜奖", "待定", "奖励内容待定，以最终评审及预算审批为准"],
];

const trackIcons = [Briefcase, Bot, Code2, ImageIcon];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="absolute inset-0 tech-hero-bg" />
        <div className="absolute inset-0 tech-circuit-grid" />
        <div className="absolute inset-0 tech-scan-lines" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 tech-data-field lg:block" />
        <div className="container relative z-10 grid max-w-6xl items-center gap-10 px-9 py-16 sm:px-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-24">
          <div>
            <Badge className="bg-brand/90 hover:bg-brand">赛事概要</Badge>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              了解 AI+X黑客松大赛
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
              这是面向东鹏集团全体员工的 AI+X黑客松大赛，鼓励大家把 AI 用到真实工作场景中，用可演示、可量化、可推广的作品推动业务提效与创新落地。
            </p>
            <RegistrationCountdown />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/projects/new">
                  提报项目 <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#schedule">查看赛程</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="tech-card relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-md">
              <p className="text-sm font-semibold tracking-[0.22em] text-white/50">
                EVENT BRIEF
              </p>
              <div className="mt-6 space-y-4">
                <Fact icon={Users} title="参赛对象" text="东鹏集团全体员工，支持个人或团队参赛，团队建议 1-5 人。" />
                <Fact icon={Target} title="核心导向" text="普及 AI、应用 AI、创造价值。" />
                <Fact icon={FileText} title="作品原则" text="尽量来源于真实工作场景，不鼓励停留在概念层面。" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tech-section-grid bg-white py-20">
        <div className="container">
          <SectionTitle eyebrow="BACKGROUND" title="活动背景" desc="AI 正在从效率工具走向业务能力，本次大赛希望让创新真正进入工作现场。" />
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="tech-card relative rounded-xl border bg-white/95 p-6 md:p-8">
              <CheckCircle2 className="h-9 w-9 text-brand" />
              <div className="mt-5 space-y-4">
                {backgroundPoints.map((text) => (
                  <p key={text} className="text-base leading-8 text-muted-foreground">
                    {text}
                  </p>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              {backgroundKeywords.map(([title, text]) => (
                <div key={title} className="tech-card relative rounded-xl border bg-white/95 p-5">
                  <h3 className="font-semibold text-brand">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="schedule" className="relative overflow-hidden bg-neutral-50 py-20">
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="container relative">
          <SectionTitle eyebrow="TIMELINE" title="活动安排" desc="从启动报名到决赛展示，关键节点一目了然。" />
          <div className="mt-12 space-y-4">
            {schedule.map(([date, title, text], index) => (
              <div key={title} className="tech-card relative grid gap-4 rounded-xl border border-neutral-200 bg-white/95 p-5 md:grid-cols-[160px_1fr]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand">{date}</p>
                  <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container">
          <SectionTitle eyebrow="TRACKS" title="四大赛道" desc="选择最贴近自己工作场景的方向，用 AI 做出看得见的改善。" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {TRACKS.map((track, index) => {
              const Icon = trackIcons[index % trackIcons.length];
              const detail = TRACK_DETAILS[track];
              return (
                <div key={track} className="tech-card relative rounded-xl border bg-white p-6">
                  <Icon className="h-9 w-9 text-brand" />
                  <h3 className="mt-4 text-xl font-semibold">{track}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">适合人群：</span>
                    {detail.audience}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
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

      <section className="relative overflow-hidden bg-neutral-50 py-20">
        <div className="container">
          <SectionTitle eyebrow="SUBMISSION" title="报名与作品提交" desc="报名时说清楚场景，提交时讲清楚价值。" />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <InfoPanel icon={ClipboardCheck} title="报名需要准备">
              <li>参赛赛道、业务场景、当前痛点</li>
              <li>参赛成员、成员分工、拟使用 AI 工具</li>
              <li>预期成果、预计价值、是否需要技术辅导</li>
              <li>涉及敏感数据时，说明数据来源和脱敏方式</li>
            </InfoPanel>
            <InfoPanel icon={ListChecks} title="作品提交建议">
              <li>作品介绍 PPT / HTML 等，建议不超过 8 页</li>
              <li>系统截图、视频、Demo 链接或现场演示材料</li>
              <li>量化效率提升、成本节约、质量改善或体验改善</li>
              <li>说明 AI 工具、模型、提示词、智能体或工作流使用方式</li>
            </InfoPanel>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container">
          <SectionTitle eyebrow="JUDGING" title="评审标准与奖项" desc="总成绩由专家评审与观众人气共同构成，重点鼓励真实业务价值、落地成效和推广潜力。" />
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="tech-card relative rounded-xl border bg-white p-6">
              <div className="flex items-center gap-3">
                <Vote className="h-8 w-8 text-brand" />
                <h3 className="text-xl font-semibold">评分规则</h3>
              </div>
              <div className="mt-6 space-y-4">
                {scoreComposition.map(([name, weight, desc]) => (
                  <div key={name} className="grid gap-2 border-b pb-4 last:border-0 last:pb-0 md:grid-cols-[110px_72px_1fr]">
                    <p className="font-semibold">{name}</p>
                    <p className="text-brand">{weight}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
              <h4 className="mt-7 font-semibold">专家评审 100 分制</h4>
              <div className="mt-4 space-y-3">
                {expertCriteria.map(([name, score, desc]) => (
                  <div key={name} className="rounded-lg border border-neutral-100 bg-neutral-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm font-semibold text-brand">{score}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
              <h4 className="mt-7 font-semibold">观众人气 20 分制</h4>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {popularityRules.map(([rank, score]) => (
                  <div key={rank} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{rank}</span>
                    <span className="font-semibold text-brand">{score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {awards.map(([name, count, reward]) => (
                <div key={name} className="tech-card relative rounded-xl border bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-7 w-7 text-brand" />
                    <div>
                      <h3 className="font-semibold">{name}</h3>
                      <p className="text-sm font-semibold text-brand">{count}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{reward}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <SectionTitle eyebrow="FAQ" title="常见问题" desc="参赛前可以先看这里。" />
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          <Faq q="我可以个人参赛吗？" a="可以。大赛支持个人参赛，也支持团队参赛，团队人数建议 1-5 人。" />
          <Faq q="作品必须已经上线吗？" a="不强制要求上线，但应尽量来源于真实工作场景，并能通过截图、视频、Demo 或现场演示讲清方案。" />
          <Faq q="只是一个创意想法可以报名吗？" a="不鼓励只停留在概念层面的想法。建议提交能说明 AI 介入方式、价值结果和推广建议的作品。" />
          <Faq q="初赛和决赛怎么评？" a="初赛以材料评审为主，入围作品进入集团人气投票；决赛以现场展示和答辩为主。" />
        </div>
      </section>
    </>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-[0.24em] text-brand">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold">{title}</h2>
      <p className="mt-3 text-muted-foreground">{desc}</p>
    </div>
  );
}

function Fact({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-white/60">{text}</p>
      </div>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tech-card relative rounded-xl border bg-white p-6">
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 text-brand" />
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
        {children}
      </ul>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="tech-card relative rounded-xl border bg-white p-5">
      <h3 className="font-semibold">{q}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{a}</p>
    </div>
  );
}
