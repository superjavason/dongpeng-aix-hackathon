"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import type { EventPhase } from "@prisma/client";
import type { Criterion } from "@/lib/constants";
import { PHASE_FLOW_MAP, PHASE_LABELS, PHASE_ORDER } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function EventSettings({
  eventId,
  phase: initialPhase,
  criteria: initialCriteria,
  resultsPublished: initialPublished,
  maxLikesPerUser: initialMaxLikes,
}: {
  eventId: string;
  phase: EventPhase;
  criteria: Criterion[];
  resultsPublished: boolean;
  maxLikesPerUser: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<EventPhase>(initialPhase);
  const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria);
  const [published, setPublished] = useState(initialPublished);
  const [maxLikes, setMaxLikes] = useState<number>(initialMaxLikes);
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>, msg: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/event/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      toast.error(data.error ?? "保存失败");
      return false;
    }
    toast.success(msg);
    router.refresh();
    return true;
  }

  async function changePhase(p: EventPhase) {
    const okDone = await patch({ phase: p }, `已切换到「${PHASE_LABELS[p]}」`);
    if (okDone) setPhase(p);
  }

  function updateCriterion(i: number, patchObj: Partial<Criterion>) {
    setCriteria((cs) =>
      cs.map((c, idx) => (idx === i ? { ...c, ...patchObj } : c))
    );
  }

  function addCriterion() {
    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().slice(0, 8)
        : `c${criteria.length + 1}`;
    setCriteria((cs) => [
      ...cs,
      { key, label: "新维度", weight: 10, max: 100 },
    ]);
  }

  function saveCriteria() {
    if (criteria.length === 0) {
      toast.error("至少保留一个评分维度");
      return;
    }
    patch({ scoreCriteria: criteria }, "评分维度已保存并重算总分");
  }

  return (
    <div className="space-y-6">
      {/* 阶段控制 */}
      <Card>
        <CardHeader>
          <CardTitle>赛事阶段</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {PHASE_ORDER.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => changePhase(p)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition",
                    p === phase
                      ? "border-brand bg-brand text-white"
                      : "bg-white hover:border-brand hover:text-brand"
                  )}
                >
                  {PHASE_LABELS[p]}
                </button>
                {i < PHASE_ORDER.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            阶段决定全站行为，并与首页「赛事流程」联动：筹备中对应全员启动会；报名组队中对应报名收集与确认、AI技术辅导；评分中对应初赛评审、观众人气投票；结果展示对应决赛暨成果展示、成果沉淀与推广。
          </p>
          <div className="mt-4 grid gap-3">
            {PHASE_ORDER.map((p) => {
              const mapping = PHASE_FLOW_MAP[p];
              return (
                <div
                  key={p}
                  className={cn(
                    "rounded-xl border p-3 text-sm",
                    p === phase
                      ? "border-brand bg-brand-50"
                      : "bg-white text-muted-foreground"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      {PHASE_LABELS[p]}
                    </span>
                    <span className="text-xs">
                      {mapping.flowItems.join(" / ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5">{mapping.behavior}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 评分维度 */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>评分维度</CardTitle>
          <Button size="sm" variant="outline" onClick={addCriterion}>
            <Plus /> 添加维度
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_100px_100px_40px] gap-2 text-xs text-muted-foreground">
            <span>维度名称</span>
            <span>权重</span>
            <span>满分</span>
            <span />
          </div>
          <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-5 text-muted-foreground">
            当前对应「关于赛事」中的专家评审 100 分制；专家评审最终占总成绩 80%，观众人气占 20%，观众人气不进入评委打分表。
          </p>
          {criteria.map((c, i) => (
            <div key={c.key} className="space-y-2 rounded-xl border p-3">
              <div className="grid grid-cols-[1fr_100px_100px_40px] items-center gap-2">
                <Input
                  value={c.label}
                  onChange={(e) => updateCriterion(i, { label: e.target.value })}
                />
                <Input
                  type="number"
                  min={1}
                  value={c.weight}
                  onChange={(e) =>
                    updateCriterion(i, { weight: Number(e.target.value) })
                  }
                />
                <Input
                  type="number"
                  min={1}
                  value={c.max}
                  onChange={(e) =>
                    updateCriterion(i, { max: Number(e.target.value) })
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() =>
                    setCriteria((cs) => cs.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={c.description ?? ""}
                placeholder="评分细则说明，例如：问题真实性 10 分、效率提升度 15 分、战略契合度 5 分"
                onChange={(e) =>
                  updateCriterion(i, { description: e.target.value })
                }
              />
            </div>
          ))}
          <Button onClick={saveCriteria} disabled={saving}>
            <Check /> 保存维度
          </Button>
        </CardContent>
      </Card>

      {/* 人气点赞 */}
      <Card>
        <CardHeader>
          <CardTitle>人气点赞</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            每位登录用户在本场赛事最多可为多少个项目点赞（每个项目 1 票）。
          </p>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxLikes">每用户点赞上限</Label>
              <Input
                id="maxLikes"
                type="number"
                min={1}
                max={100}
                className="w-32"
                value={maxLikes}
                onChange={(e) => setMaxLikes(Number(e.target.value))}
              />
            </div>
            <Button
              disabled={saving}
              onClick={() => {
                if (!Number.isInteger(maxLikes) || maxLikes < 1 || maxLikes > 100) {
                  toast.error("点赞上限需为 1–100 的整数");
                  return;
                }
                patch({ maxLikesPerUser: maxLikes }, "点赞上限已保存");
              }}
            >
              <Check /> 保存上限
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            调低上限不会撤回用户已投出的票，仅影响后续点赞额度。
          </p>
        </CardContent>
      </Card>

      {/* 结果发布 */}
      <Card>
        <CardHeader>
          <CardTitle>结果发布</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            发布后，参赛者与公众可在排行榜查看各作品均分与名次。
            {phase !== "ended" && (
              <span className="block text-amber-600">
                建议在「结果展示」阶段发布。
              </span>
            )}
          </p>
          <Button
            variant={published ? "outline" : "default"}
            disabled={saving}
            onClick={async () => {
              const okDone = await patch(
                { resultsPublished: !published },
                published ? "已撤回结果" : "结果已发布"
              );
              if (okDone) setPublished(!published);
            }}
          >
            {published ? "撤回发布" : "发布结果"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
