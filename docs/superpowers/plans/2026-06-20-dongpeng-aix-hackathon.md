# 东鹏 AI+X 黑客松平台 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 构建东鹏 AI+X 黑客松全栈平台：项目提报、自由组队（发起人审核）、作品提交、评委多维度打分、管理员后台。

**Architecture:** Next.js 15 App Router 全栈单体，Route Handlers 作为 API，Prisma + Postgres 持久化，Auth.js 凭据鉴权 + 角色 middleware 守卫，@vercel/blob 文件存储。业务逻辑（评分加权、阶段-操作权限矩阵）抽成纯函数并单测。

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, Prisma, Postgres, Auth.js (NextAuth v5), @vercel/blob, Zod, Vitest, pnpm.

## Global Constraints

- 包管理一律 pnpm
- 中文界面；品牌色红 `#D9241F` + 黑；鹰徽 logo（`assets/logo2.png`）
- 角色：participant / judge / admin；注册默认 participant
- 赛事阶段：draft → registration → in_progress → judging → ended
- 前端默认只展示 `isActive=true` 的当前赛事
- API 统一返回 `{ ok: true, data } | { ok: false, error }`
- 所有表单用 Zod 前后端共享校验

---

## Task 1: 脚手架与主题

**Files:** Create `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `lib/utils.ts`, `components/ui/*`, `vitest.config.ts`, `.env.example`, `.gitignore`, `public/logo.png`.

- [ ] 用 pnpm 初始化 Next.js 15 + TS + Tailwind + App Router
- [ ] 装依赖：prisma @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs zod @vercel/blob；dev：vitest @types/bcryptjs tsx
- [ ] 配置 Tailwind 主题（品牌色 token）+ shadcn 基础组件（button/input/card/badge/dialog/select/textarea/table/tabs/avatar/sonner）
- [ ] 复制 logo 到 public，写全局 layout（字体、Toaster）
- [ ] 占位首页能 `pnpm dev` 跑通
- [ ] Commit

## Task 2: Prisma schema + 数据库 + 种子

**Files:** Create `prisma/schema.prisma`, `lib/db.ts`, `prisma/seed.ts`.

- [ ] 按 spec 第 5 节定义全部 model + enum（Role/EventPhase/MembershipStatus/TeamRole）
- [ ] `lib/db.ts` 单例 PrismaClient
- [ ] `prisma db push` 建表
- [ ] seed：1 管理员、2 评委、若干参赛者、1 个 isActive 赛事（含 scoreCriteria 4 维度）、示例项目/报名/作品
- [ ] Commit

## Task 3: 业务纯函数 + 单测（TDD）

**Files:** Create `lib/scoring.ts`, `lib/permissions.ts`, `lib/__tests__/scoring.test.ts`, `lib/__tests__/permissions.test.ts`.

**Interfaces produced:**
- `computeTotal(scores: Record<string,number>, criteria: Criterion[]): number` — 加权求和（权重和归一）
- `averageScore(totals: number[]): number | null`
- `can(action: Action, ctx: {phase, role, isOwner?, isMember?}): boolean` — 阶段×角色×操作权限矩阵

- [ ] 写 scoring 失败测试（加权、空值、边界）
- [ ] 实现 scoring，测试通过
- [ ] 写 permissions 失败测试（覆盖：报名仅 registration、提交作品仅 in_progress 且 member、打分仅 judging 且 judge）
- [ ] 实现 permissions，测试通过
- [ ] Commit

## Task 4: 鉴权（注册/登录/角色守卫）

**Files:** Create `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/register/route.ts`, `middleware.ts`, `lib/session.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `lib/schemas.ts`.

**Interfaces produced:** `auth()` 取 session；`getCurrentUser()`；`requireRole(role)`。

- [ ] Auth.js v5 Credentials provider + Prisma 查用户 + bcrypt 校验；session 带 role
- [ ] 注册 API：Zod 校验、查重、bcrypt、建 participant
- [ ] middleware 守卫 `/admin`（admin）、`/judge`（judge）、`/dashboard`（登录）
- [ ] 登录/注册页面（品牌风格表单）
- [ ] 手测：注册→登录→session 有 role
- [ ] Commit

## Task 5: 文件上传（Blob）

**Files:** Create `app/api/upload/route.ts`, `components/upload/image-uploader.tsx`, `components/upload/file-uploader.tsx`, `lib/storage.ts`.

- [ ] `lib/storage.ts` 封装 `put` 到 Vercel Blob（校验类型/大小），返回 URL
- [ ] upload Route Handler（需登录）
- [ ] 图片上传组件（预览）+ 附件上传组件（文件名+删除）
- [ ] Commit

## Task 6: 项目提报 + 广场 + 详情

**Files:** Create `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`, `app/projects/page.tsx`, `app/projects/[id]/page.tsx`, `app/projects/new/page.tsx`, `components/project/project-card.tsx`, `components/project/project-form.tsx`.

- [ ] 创建项目 API（仅 registration 阶段，登录者；owner 自动成为 approved owner membership）
- [ ] 项目列表/详情 API（含成员、剩余名额）
- [ ] 广场页：卡片 + 赛道筛选 + 搜索
- [ ] 详情页 + 提报表单（封面上传，复用 Task5）
- [ ] 手测：提报→广场可见→详情正确
- [ ] Commit

## Task 7: 报名 + 审核组队

**Files:** Create `app/api/projects/[id]/apply/route.ts`, `app/api/memberships/[id]/route.ts`, `app/dashboard/page.tsx`, `components/dashboard/*`.

- [ ] 报名 API（registration 阶段，非成员，未满员，创建 pending membership）
- [ ] 审核 API（仅 owner，approve/reject；approve 校验未超 maxMembers）
- [ ] 工作台：我发起的项目 + 待审列表（通过/拒绝按钮）+ 我加入的队伍
- [ ] 手测：A 报名→B(owner) 通过→A 成为 member
- [ ] Commit

## Task 8: 作品提交

**Files:** Create `app/api/projects/[id]/submission/route.ts`, `app/dashboard/submission/[projectId]/page.tsx`, `components/submission/submission-form.tsx`.

- [ ] 提交/更新作品 API（仅 in_progress；仅 approved 成员；upsert Submission；图片+附件+链接）
- [ ] 进入 judging 后只读锁定
- [ ] 工作台作品入口 + 表单
- [ ] 手测：成员提交→更新→judging 锁定
- [ ] Commit

## Task 9: 评委后台 + 多维打分

**Files:** Create `app/judge/page.tsx`, `app/judge/[submissionId]/page.tsx`, `app/api/scores/route.ts`, `components/judge/score-form.tsx`.

- [ ] 待评列表 API（含分配过滤 JudgeAssignment；无分配=全部）+ 进度统计
- [ ] 打分 API（仅 judging + judge；按 scoreCriteria 校验范围；computeTotal；upsert Score）
- [ ] 评分页：作品全貌 + 维度滑杆/输入 + 评语 + 提交
- [ ] 手测：评委打分→可改→进度更新
- [ ] Commit

## Task 10: 管理员后台

**Files:** Create `app/admin/page.tsx`, `app/admin/users/page.tsx`, `app/admin/projects/page.tsx`, `app/admin/submissions/page.tsx`, `app/admin/judges/page.tsx`, `app/admin/event/page.tsx`, 对应 `app/api/admin/*` 路由。

- [ ] 看板统计 API + 页面
- [ ] 用户管理（改角色/禁用）
- [ ] 项目/作品管理（查看/删除）
- [ ] 评委管理（设为评委、分配作品）
- [ ] 赛事设置（切换 phase、编辑 scoreCriteria、发布结果）
- [ ] 所有 admin API requireRole(admin)
- [ ] 手测：切阶段驱动前台行为；发布结果
- [ ] Commit

## Task 11: 结果发布 + 排行榜 + 首页打磨

**Files:** Create `app/leaderboard/page.tsx`, `app/api/leaderboard/route.ts`; Modify `app/page.tsx`, `app/dashboard/page.tsx`.

- [ ] 排行榜 API（resultsPublished 时按均分排序）
- [ ] 排行榜页 + 工作台「我的成绩」
- [ ] 首页：Hero + 赛程时间轴 + 赛道 + 奖项 + CTA，东鹏品牌打磨
- [ ] Commit

## Task 12: 文档 + 收尾

**Files:** Create `README.md`.

- [ ] README：环境变量、`pnpm install`、`prisma db push`、`seed`、`dev`、演示账号
- [ ] `pnpm build` 跑通；`pnpm test` 通过
- [ ] Commit

---

## Self-Review

- 覆盖 spec 全部 11 节：鉴权(T4)、上传(T5)、提报(T6)、报名审核(T7)、作品(T8)、评委(T9)、管理员(T10)、结果(T11)、数据模型(T2)、业务规则(T3)、测试(T3+各任务手测)。
- 无 TBD/占位。
- 类型一致：computeTotal/averageScore/can/getCurrentUser/requireRole 全程统一命名。
