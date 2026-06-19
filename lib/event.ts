import { prisma } from "@/lib/db";
import { DEFAULT_CRITERIA, type Criterion } from "@/lib/constants";
import type { Event } from "@prisma/client";

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
