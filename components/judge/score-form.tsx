"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Criterion } from "@/lib/constants";
import { computeTotal } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ScoreForm({
  submissionId,
  criteria,
  initialScores,
  initialComment,
  disabled,
}: {
  submissionId: string;
  criteria: Criterion[];
  initialScores: Record<string, number>;
  initialComment: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of criteria) {
      init[c.key] = initialScores[c.key] ?? Math.round(c.max * 0.8);
    }
    return init;
  });
  const [comment, setComment] = useState(initialComment);

  const total = useMemo(
    () => computeTotal(scores, criteria),
    [scores, criteria]
  );

  function setScore(key: string, value: number) {
    setScores((s) => ({ ...s, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, scores, comment }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "提交失败");
      return;
    }
    toast.success(`评分已提交，总分 ${data.data.total}`);
    router.push("/judge");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {criteria.map((c) => (
        <div key={c.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-baseline gap-2">
              {c.label}
              <span className="text-xs text-muted-foreground">
                权重 {c.weight} · 满分 {c.max}
              </span>
            </Label>
            <span className="text-lg font-semibold tabular-nums text-brand">
              {scores[c.key]}
            </span>
          </div>
          {c.description && (
            <p className="text-xs leading-5 text-muted-foreground">
              {c.description}
            </p>
          )}
          <input
            type="range"
            min={0}
            max={c.max}
            step={1}
            value={scores[c.key]}
            disabled={disabled}
            onChange={(e) => setScore(c.key, Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-brand disabled:cursor-not-allowed"
          />
        </div>
      ))}

      <div className="space-y-1.5">
        <Label htmlFor="comment">评语（选填）</Label>
        <Textarea
          id="comment"
          value={comment}
          disabled={disabled}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="对作品的点评与建议…"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-neutral-50 p-4">
        <span className="text-sm text-muted-foreground">加权总分</span>
        <span className="text-3xl font-bold text-brand">{total}</span>
      </div>

      {disabled ? (
        <p className="text-center text-sm text-muted-foreground">
          当前阶段不可评分
        </p>
      ) : (
        <Button onClick={submit} size="lg" className="w-full" disabled={loading}>
          {loading ? "提交中…" : "提交评分"}
        </Button>
      )}
    </div>
  );
}
