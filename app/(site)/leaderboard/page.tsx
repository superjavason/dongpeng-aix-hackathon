import Link from "next/link";
import { Trophy, Medal, Lock } from "lucide-react";
import { getActiveEvent } from "@/lib/event";
import { getRankedSubmissions } from "@/lib/leaderboard";
import { PHASE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const MEDALS = ["text-amber-400", "text-neutral-400", "text-amber-700"];

export default async function LeaderboardPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <main className="container py-20 text-center text-muted-foreground">
        当前没有进行中的赛事。
      </main>
    );
  }

  if (!event.resultsPublished) {
    return (
      <main className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border bg-neutral-50 p-10 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold">结果尚未公布</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            当前赛事处于「{PHASE_LABELS[event.phase]}」阶段，结果公布后即可在此查看排名。
          </p>
          <Link
            href="/projects"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            先去项目广场看看 →
          </Link>
        </div>
      </main>
    );
  }

  const ranked = (await getRankedSubmissions(event.id)).filter(
    (r) => r.average !== null
  );

  return (
    <main className="container py-10">
      <div className="text-center">
        <Trophy className="mx-auto h-10 w-10 text-brand" />
        <h1 className="mt-3 text-3xl font-bold">赛事排行榜</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {event.name} · 最终成绩
        </p>
      </div>

      {ranked.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">暂无评分数据</p>
      ) : (
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {ranked.map((r) => (
            <Card
              key={r.submissionId}
              className={r.rank <= 3 ? "border-brand/30 shadow-sm" : ""}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex w-12 shrink-0 items-center justify-center">
                  {r.rank <= 3 ? (
                    <Medal className={`h-7 w-7 ${MEDALS[r.rank - 1]}`} />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {r.rank}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="font-semibold hover:underline"
                  >
                    {r.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.projectTitle} · {r.memberNames.join("、")}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {r.track}
                </Badge>
                <div className="w-20 shrink-0 text-right">
                  <p className="text-2xl font-bold text-brand">{r.average}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {r.scoreCount} 位评委
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
