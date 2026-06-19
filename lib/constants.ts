import type { EventPhase, Role, MembershipStatus } from "@prisma/client";

export type Criterion = {
  key: string;
  label: string;
  weight: number; // 相对权重
  max: number; // 该维度满分
};

export const DEFAULT_CRITERIA: Criterion[] = [
  { key: "innovation", label: "创新性", weight: 30, max: 100 },
  { key: "technical", label: "技术实现", weight: 30, max: 100 },
  { key: "business", label: "商业价值", weight: 20, max: 100 },
  { key: "completeness", label: "完成度", weight: 20, max: 100 },
];

export const TRACKS = [
  "AI + 智能制造",
  "AI + 营销增长",
  "AI + 设计创意",
  "AI + 办公提效",
  "AI + 用户体验",
  "AI + 其他",
] as const;

export const PHASE_LABELS: Record<EventPhase, string> = {
  draft: "筹备中",
  registration: "报名组队中",
  in_progress: "比赛进行中",
  judging: "评分中",
  ended: "已结束",
};

export const PHASE_ORDER: EventPhase[] = [
  "draft",
  "registration",
  "in_progress",
  "judging",
  "ended",
];

export const ROLE_LABELS: Record<Role, string> = {
  participant: "参赛者",
  judge: "评委",
  admin: "管理员",
};

export const MEMBERSHIP_LABELS: Record<MembershipStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};
