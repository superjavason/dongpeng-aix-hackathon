import Link from "next/link";
import { Trophy, Medal, Lock, Heart } from "lucide-react";
import { getActiveEvent } from "@/lib/event";
import { getRankedSubmissions } from "@/lib/leaderboard";
import { getPopularityRanking } from "@/lib/likes";
import { PHASE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

const MEDALS = ["text-amber-400", "text-neutral-400", "text-amber-700"];

function RankMedal({ rank }: { rank: number }) {
  return (
    <div className="flex w-12 shrink-0 items-center justify-center">
      {rank <= 3 ? (
        <Medal className={`h-7 w-7 ${MEDALS[rank - 1]}`} />
      ) : (
        <span className="text-lg font-bold text-muted-foreground">{rank}</span>
      )}
    </div>
  );
}

export default async function LeaderboardPage() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <main className="container py-20 text-center text-muted-foreground">
        当前没有进行中的赛事。
      </main>
    );
  }

  const [popular, ranked] = await Promise.all([
    getPopularityRanking(event.id),
    event.resultsPublished
      ? getRankedSubmissions(event.id).then((rows) =>
          rows.filter((r) => r.average !== null)
        )
      : Promise.resolve(null),
  ]);

  return (
    <main className="container py-10">
      <div className="text-center">
        <Trophy className="mx-auto h-10 w-10 text-brand" />
        <h1 className="mt-3 text-3xl font-bold">赛事排行榜</h1>
        <p className="mt-2 text-sm text-muted-foreground">{event.name}</p>
      </div>

      <Tabs defaultValue="popular" className="mx-auto mt-8 max-w-3xl">
        <TabsList className="mx-auto flex w-full max-w-sm">
          <TabsTrigger value="popular" className="flex-1">
            人气榜
          </TabsTrigger>
          <TabsTrigger value="score" className="flex-1">
            评分榜
          </TabsTrigger>
        </TabsList>

        {/* 人气榜：实时公开 */}
        <TabsContent value="popular" className="mt-6">
          <p className="mb-4 text-center text-xs text-muted-foreground">
            观众人气实时更新，登录后每人每场赛事可为多个项目点赞。
          </p>
          {popular.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground">
              还没有项目获得点赞，快去项目广场为你喜欢的项目点赞吧。
            </p>
          ) : (
            <div className="space-y-3">
              {popular.map((r) => (
                <Card
                  key={r.projectId}
                  className={r.rank <= 3 ? "border-brand/30 shadow-sm" : ""}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <RankMedal rank={r.rank} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${r.projectId}`}
                        className="font-semibold hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.tagline} · 发起人 {r.ownerName}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {r.track}
                    </Badge>
                    <div className="flex w-20 shrink-0 items-center justify-end gap-1.5">
                      <Heart className="h-5 w-5 fill-brand-red text-brand-red" />
                      <span className="text-2xl font-bold text-brand">
                        {r.likeCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 评分榜：沿用结果发布门控 */}
        <TabsContent value="score" className="mt-6">
          {!ranked ? (
            <div className="mx-auto max-w-md rounded-2xl border bg-neutral-50 p-10 text-center">
              <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-bold">结果尚未公布</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                当前赛事处于「{PHASE_LABELS[event.phase]}」阶段，结果公布后即可在此查看专家评分排名。
              </p>
            </div>
          ) : ranked.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground">暂无评分数据</p>
          ) : (
            <div className="space-y-3">
              {ranked.map((r) => (
                <Card
                  key={r.submissionId}
                  className={r.rank <= 3 ? "border-brand/30 shadow-sm" : ""}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <RankMedal rank={r.rank} />
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
        </TabsContent>
      </Tabs>
    </main>
  );
}
