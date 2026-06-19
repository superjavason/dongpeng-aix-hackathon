import Link from "next/link";
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
    <main className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold">提报项目</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        发起一个项目，招募志同道合的队友
      </p>

      {allowed ? (
        <div className="mt-8">
          <ProjectForm />
        </div>
      ) : (
        <div className="mt-8 rounded-xl border bg-neutral-50 p-8 text-center">
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
    </main>
  );
}
