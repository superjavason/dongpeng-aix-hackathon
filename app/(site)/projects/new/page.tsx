import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lightbulb, Target } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getActiveEvent } from "@/lib/event";
import { PHASE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/project/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const user = await getSessionUser();
  const event = await getActiveEvent();

  const allowed =
    user?.role === "participant" && event?.phase === "registration";

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="absolute inset-0 tech-hero-bg" />
        <div className="absolute inset-0 tech-circuit-grid" />
        <div className="absolute inset-0 tech-scan-lines" />

        <div className="container relative z-10 py-12 lg:py-16">
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/projects">
              <ArrowLeft /> 返回项目广场
            </Link>
          </Button>

          <div className="mt-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-brand-red">
              Submit Project
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              提报你的 AI+X 项目
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              用一句话完成项目亮相，再把业务痛点、解决方案和预期价值讲清楚，
              方便队友加入，也方便评审快速理解项目的落地潜力。
            </p>
          </div>
        </div>
      </section>

      <section className="container relative z-20 -mt-8 pb-16">
        {allowed ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-3xl border bg-white p-6 shadow-2xl shadow-black/10 sm:p-8">
              <ProjectForm />
            </div>

            <aside className="h-fit rounded-3xl border bg-white p-6 shadow-xl shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-red">
                Tips
              </p>
              <h2 className="mt-2 text-xl font-bold">填写建议</h2>
              <div className="mt-6 space-y-5 text-sm leading-6 text-muted-foreground">
                <div className="flex gap-3">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-red" />
                  <p>
                    项目介绍保持简洁，重点放在“它是什么、给谁用”。
                  </p>
                </div>
                <div className="flex gap-3">
                  <Target className="mt-0.5 size-5 shrink-0 text-brand-red" />
                  <p>
                    场景痛点尽量贴近真实业务，可以写当前流程、问题和影响。
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-red" />
                  <p>
                    预期价值建议写清楚效率、成本、体验、风险或推广价值。
                  </p>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-3xl border bg-white p-8 text-center shadow-xl shadow-black/5">
            <p className="text-muted-foreground">
              {!event
                ? "当前没有进行中的赛事。"
                : event.phase !== "registration"
                  ? `当前赛事处于「${PHASE_LABELS[event.phase]}」阶段，提报通道已关闭。`
                  : "仅参赛者可提报项目。"}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/projects">返回项目广场</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
