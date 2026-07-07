import { prisma } from "@/lib/db";
import { DEFAULT_CRITERIA, type Criterion } from "@/lib/constants";
import type { Event } from "@prisma/client";

export type EventLike = { id: string; isActive: boolean };

/** 后台"当前管理赛事"回落逻辑（events 需按 createdAt desc 排序）。 */
export function resolveAdminEvent<T extends EventLike>(
  cookieId: string | null | undefined,
  events: T[]
): T | null {
  if (events.length === 0) return null;
  if (cookieId) {
    const hit = events.find((e) => e.id === cookieId);
    if (hit) return hit;
  }
  const active = events.find((e) => e.isActive);
  if (active) return active;
  return events[0];
}

/** 当前活跃赛事（前端默认展示的单场）。 */
export async function getActiveEvent() {
  return prisma.event.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/** 从赛事记录读取评分维度配置，回落到默认。 */
export function getCriteria(event: Pick<Event, "scoreCriteria"> | null): Criterion[] {
  if (!event) return DEFAULT_CRITERIA;
  const raw = event.scoreCriteria;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw as unknown as Criterion[];
  }
  return DEFAULT_CRITERIA;
}
