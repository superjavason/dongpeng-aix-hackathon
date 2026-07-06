import type { EventPhase, Role, MembershipStatus } from "@prisma/client";

export type Criterion = {
  key: string;
  label: string;
  weight: number; // 相对权重
  max: number; // 该维度满分
  description?: string; // 评分细则说明
};

export const DEFAULT_CRITERIA: Criterion[] = [
  {
    key: "business_value",
    label: "业务价值",
    weight: 30,
    max: 30,
    description: "问题真实性 10 分、效率提升度 15 分、战略契合度 5 分。",
  },
  {
    key: "solution_quality",
    label: "方案质量",
    weight: 25,
    max: 25,
    description: "创新性 10 分、技术合理性 10 分、安全合规性 5 分。",
  },
  {
    key: "implementation_result",
    label: "落地成效",
    weight: 30,
    max: 30,
    description: "完成度 10 分、实际使用情况 15 分、稳定可用性 5 分。",
  },
  {
    key: "promotion_potential",
    label: "推广潜力",
    weight: 15,
    max: 15,
    description: "可复制性 8 分、投入产出比 4 分、呈现与文档 3 分。",
  },
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
  in_progress: "作品提交中",
  judging: "评分中",
  ended: "结果展示",
};

export const PHASE_FLOW_MAP: Record<
  EventPhase,
  { label: string; flowItems: string[]; behavior: string }
> = {
  draft: {
    label: "筹备中",
    flowItems: ["全员启动会"],
    behavior: "活动预热与规则宣贯，不开放提报、作品提交或评分。",
  },
  registration: {
    label: "报名组队中",
    flowItems: ["报名收集与确认", "AI技术辅导"],
    behavior: "开放项目提报、报名加入、队长审核，并推进赛道辅导。",
  },
  in_progress: {
    label: "作品提交中",
    flowItems: ["AI技术辅导"],
    behavior: "项目继续打磨，已组队成员可提交或更新作品。",
  },
  judging: {
    label: "评分中",
    flowItems: ["初赛评审", "观众人气投票"],
    behavior: "锁定作品提交，开放评委评分，并对应观众人气投票阶段。",
  },
  ended: {
    label: "结果展示",
    flowItems: ["决赛暨成果展示", "成果沉淀与推广"],
    behavior: "展示最终结果、决赛成果与后续沉淀推广内容。",
  },
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
