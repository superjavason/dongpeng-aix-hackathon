import type { EventPhase, Role, MembershipStatus } from "@prisma/client";

export type Criterion = {
  key: string;
  label: string;
  weight: number; // 相对权重
  max: number; // 该维度满分
};

export const DEFAULT_CRITERIA: Criterion[] = [
  { key: "business_value", label: "业务价值", weight: 30, max: 100 },
  { key: "solution_quality", label: "方案质量", weight: 25, max: 100 },
  { key: "implementation_result", label: "落地成效", weight: 30, max: 100 },
  { key: "promotion_potential", label: "推广潜力", weight: 15, max: 100 },
];

export const TRACKS = [
  "AI办公提效赛道",
  "AI智能体赛道",
  "AI编程开发赛道",
  "AIGC创意赛道",
] as const;

export const TRACK_DETAILS: Record<
  (typeof TRACKS)[number],
  { audience: string; scenes: string; output: string; requirement: string }
> = {
  AI办公提效赛道: {
    audience: "职能部门、日常办公人员",
    scenes: "报表处理、会议纪要、文档撰写、数据统计、流程跟进",
    output: "提示词模板、智能表格、自动化流程、办公提效案例",
    requirement: "说明原工作耗时、AI介入方式与提效结果",
  },
  AI智能体赛道: {
    audience: "IT、数字化团队、具备工具操作能力的员工",
    scenes: "问答智能体、流程自动化、知识库助手、业务助手",
    output: "智能体、工作流、应用 Demo",
    requirement: "需能现场演示基本功能",
  },
  AI编程开发赛道: {
    audience: "研发、IT、测试、数据人员",
    scenes: "代码生成、测试提效、脚本工具、数据处理",
    output: "脚本、插件、小工具、自动化程序",
    requirement: "提供运行说明或演示截图",
  },
  AIGC创意赛道: {
    audience: "全体员工",
    scenes: "企业宣传、品牌传播、文化建设、培训内容制作",
    output: "海报、视频、动画、漫画、宣传物料",
    requirement: "说明创意主题、AI工具使用过程及传播价值",
  },
};

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
