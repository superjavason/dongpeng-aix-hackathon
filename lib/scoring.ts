import type { Criterion } from "./constants";

/**
 * 根据各维度得分与维度配置，计算 0-100 的加权总分。
 * 总分 = Σ( (该维度得分 / 该维度满分) × 权重 ) / Σ权重 × 100
 * 缺失或非法的维度按 0 计。
 */
export function computeTotal(
  scores: Record<string, number>,
  criteria: Criterion[]
): number {
  if (!criteria || criteria.length === 0) return 0;
  const totalWeight = criteria.reduce((s, c) => s + (c.weight || 0), 0);
  if (totalWeight <= 0) return 0;

  const weighted = criteria.reduce((sum, c) => {
    const raw = Number(scores?.[c.key]);
    const max = c.max > 0 ? c.max : 100;
    const clamped = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), max) : 0;
    return sum + (clamped / max) * c.weight;
  }, 0);

  const result = (weighted / totalWeight) * 100;
  return Math.round(result * 100) / 100;
}

/** 多位评委总分的算术平均；无评分返回 null。 */
export function averageScore(totals: number[]): number | null {
  if (!totals || totals.length === 0) return null;
  const sum = totals.reduce((s, t) => s + t, 0);
  return Math.round((sum / totals.length) * 100) / 100;
}
