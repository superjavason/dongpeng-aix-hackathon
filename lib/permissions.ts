import type { EventPhase, Role } from "@prisma/client";

export type Action =
  | "create_project"
  | "apply"
  | "review_application"
  | "submit_work"
  | "score";

export type PermissionContext = {
  phase: EventPhase;
  role: Role;
  isOwner?: boolean;
  isMember?: boolean; // 是否为该项目已通过的成员
};

/**
 * 阶段 × 角色 × 操作的权限矩阵。管理员不通过此函数（管理员后台单独 requireRole）。
 */
export function can(action: Action, ctx: PermissionContext): boolean {
  const { phase, role, isOwner, isMember } = ctx;

  switch (action) {
    case "create_project":
      return role === "participant" && phase === "registration";

    case "apply":
      // 报名：报名阶段、参赛者、且尚未是成员
      return role === "participant" && phase === "registration" && !isMember;

    case "review_application":
      // 审核报名：项目发起人、报名阶段
      return role === "participant" && !!isOwner && phase === "registration";

    case "submit_work":
      // 提交作品：比赛进行中、已通过的队伍成员
      return role === "participant" && phase === "in_progress" && !!isMember;

    case "score":
      // 打分：评分中、评委
      return role === "judge" && phase === "judging";

    default:
      return false;
  }
}
