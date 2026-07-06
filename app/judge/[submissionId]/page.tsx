import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  LinkIcon,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getActiveEvent, getCriteria } from "@/lib/event";
import { parseProjectDescription } from "@/lib/project-description";
import type { StoredFile } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreForm } from "@/components/judge/score-form";

export const dynamic = "force-dynamic";

const scoringGuide = [
  {
    dimension: "业务价值",
    total: "30分",
    items: [
      {
        name: "问题真实性",
        score: "10分",
        desc: "痛点是否真实存在，是否高频，影响范围多大，包括个人级、部门级、公司级。",
      },
      {
        name: "效率提升度",
        score: "15分",
        desc: "是否能量化收益，包括节省人时、缩短周期、降低成本、减少差错率等，需有 before / after 数据支撑。",
      },
      {
        name: "战略契合度",
        score: "5分",
        desc: "是否与公司 AI+X 战略方向、年度重点业务方向匹配。",
      },
    ],
  },
  {
    dimension: "方案质量",
    total: "25分",
    items: [
      {
        name: "创新性",
        score: "10分",
        desc: "是否为全新解法、跨域迁移，还是已有方案的简单复用；AI 是否为必要手段，而非“为 AI 而 AI”。",
      },
      {
        name: "技术合理性",
        score: "10分",
        desc: "模型/工具选型是否恰当，架构是否简洁，Prompt、Agent、RAG 等运用是否得当。",
      },
      {
        name: "安全合规性",
        score: "5分",
        desc: "是否考虑数据安全、隐私保护、输出可控性等；无硬伤为基准，有设计加分。",
      },
    ],
  },
  {
    dimension: "落地成效",
    total: "30分",
    items: [
      {
        name: "完成度",
        score: "10分",
        desc: "Demo、试点、已上线、常态化运行等完成情况，按不同阶段区分评分。",
      },
      {
        name: "实际使用情况",
        score: "15分",
        desc: "是否有真实用户数、使用频次、留存情况，而非仅停留在演示效果。",
      },
      {
        name: "稳定可用性",
        score: "5分",
        desc: "故障率、准确率、用户满意度反馈等情况。",
      },
    ],
  },
  {
    dimension: "推广潜力",
    total: "15分",
    items: [
      {
        name: "可复制性",
        score: "8分",
        desc: "是否可迁移到其他部门/场景，改造成本是否高，是否已沉淀 SOP、模板或 Skill。",
      },
      {
        name: "投入产出比",
        score: "4分",
        desc: "后续推广所需投入与预期收益是否匹配。",
      },
      {
        name: "呈现与文档",
        score: "3分",
        desc: "路演表达是否清晰，文档是否完整，是否便于他人理解、接手和复用。",
      },
    ],
  },
] as const;

export default async function JudgeScorePage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const judge = await requireRole("judge");
  const event = await getActiveEvent();

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      project: {
        include: {
          owner: { select: { name: true } },
          memberships: {
            where: { status: "approved" },
            include: { user: { select: { name: true } } },
          },
        },
      },
      scores: { where: { judgeId: judge.id } },
    },
  });
  if (!submission) notFound();

  const assignedCount = await prisma.judgeAssignment.count({
    where: { judgeId: judge.id },
  });
  if (assignedCount > 0) {
    const assigned = await prisma.judgeAssignment.findUnique({
      where: { judgeId_submissionId: { judgeId: judge.id, submissionId } },
    });
    if (!assigned) redirect("/judge");
  }

  const criteria = getCriteria(event);
  const myScore = submission.scores[0];
  const images = (submission.images as string[]) ?? [];
  const attachments = (submission.attachments as StoredFile[]) ?? [];
  const disabled = event?.phase !== "judging";
  const projectSections = parseProjectDescription(submission.project.description);

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
            <Link href="/judge">
              <ArrowLeft /> 返回评审列表
            </Link>
          </Button>

          <div className="mt-10 max-w-4xl">
            <Badge className="bg-white/10 text-white hover:bg-white/10">
              {submission.project.track}
            </Badge>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              {submission.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
              项目：{submission.project.title} · 发起人：{submission.project.owner.name}
            </p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/60">
              {submission.project.tagline}
            </p>
          </div>
        </div>
      </section>

      <section className="container relative z-20 -mt-8 pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-xl shadow-black/5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-brand-red" />
                  <div>
                    <h2 className="text-xl font-bold">作品材料</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      评审时请结合作品说明、演示材料和项目提报信息综合判断。
                    </p>
                  </div>
                </div>

                <p className="mt-5 whitespace-pre-wrap leading-8 text-foreground/90">
                  {submission.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  {submission.repoUrl && (
                    <MaterialLink href={submission.repoUrl} label="代码仓库" />
                  )}
                  {submission.demoUrl && (
                    <MaterialLink href={submission.demoUrl} label="Demo" />
                  )}
                  {submission.videoUrl && (
                    <MaterialLink href={submission.videoUrl} label="演示视频" />
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <SectionTitle title="项目提报信息" desc="以下内容来自项目发起时填写的信息，便于评委理解业务背景与落地价值。" />
              {projectSections.map((section) => {
                const Icon = section.icon;
                return (
                  <article
                    key={section.label}
                    className="rounded-3xl border bg-white p-6 shadow-xl shadow-black/5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-red">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">{section.label}</h3>
                        {section.helper && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {section.helper}
                          </p>
                        )}
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

            {images.length > 0 && (
              <div className="space-y-4">
                <SectionTitle title="作品图片" desc="截图、界面或演示素材。" />
                <div className="grid grid-cols-2 gap-3">
                  {images.map((url) => (
                    <div
                      key={url}
                      className="relative h-44 overflow-hidden rounded-2xl border bg-neutral-50"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="space-y-4">
                <SectionTitle title="附件" desc="可下载查看的补充材料。" />
                <div className="space-y-2">
                  {attachments.map((f) => (
                    <a
                      key={f.url}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm hover:bg-accent"
                    >
                      <span className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-brand-red" />
                        {f.name}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Card className="rounded-3xl shadow-xl shadow-black/5">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  团队成员
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {submission.project.memberships.map((m) => (
                    <Badge key={m.id} variant="outline">
                      {m.user.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6 rounded-3xl shadow-2xl shadow-black/10">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold">评分表</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  专家评审采用 100 分制，最终按 80%计入总成绩；观众人气另按 20%计入。
                </p>
                <ScoringGuide />
                <div className="mt-6">
                  <ScoreForm
                    submissionId={submission.id}
                    criteria={criteria}
                    initialScores={(myScore?.scores as Record<string, number>) ?? {}}
                    initialComment={myScore?.comment ?? ""}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoringGuide() {
  return (
    <details className="mt-5 rounded-2xl border bg-neutral-50/70 p-4 open:pb-5">
      <summary className="cursor-pointer select-none text-sm font-semibold text-foreground">
        详细评分说明
      </summary>
      <div className="mt-4 space-y-4">
        {scoringGuide.map((group) => (
          <div key={group.dimension} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{group.dimension}</h3>
              <Badge variant="secondary">{group.total}</Badge>
            </div>
            <div className="mt-3 space-y-3">
              {group.items.map((item) => (
                <div key={item.name} className="border-t pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{item.name}</p>
                    <span className="shrink-0 text-sm font-semibold text-brand-red">
                      {item.score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function MaterialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium text-brand-red hover:bg-brand-50"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </a>
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
