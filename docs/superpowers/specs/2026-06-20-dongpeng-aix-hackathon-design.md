# 东鹏 AI+X 黑客松平台 — 设计文档

- **日期**：2026-06-20
- **状态**：已评审，待用户最终确认
- **品牌**：东鹏 DONGPENG（科技·艺术·生活），主色红 `#D9241F` + 黑 + 大量留白，鹰徽 logo，中文界面

## 1. 目标

一个精美的 AI+X 黑客松平台，覆盖完整赛事生命周期：

1. 参赛者**提报项目**并担任发起人
2. 其他参赛者**报名加入**已发起项目，**自由组队**
3. 报名需项目**发起人审核通过**
4. 比赛开始后，参赛团队**提交作品**（可多次更新，截止后锁定）
5. 专业评委登入**评委后台**，按**多维度评分表**为作品打分
6. **管理员后台**管理用户、项目、作品、评委，并控制赛事阶段与结果发布

## 2. 技术栈

- **框架**：Next.js 15（App Router）+ TypeScript + React Server Components
- **样式**：Tailwind CSS + shadcn/ui 组件库；东鹏品牌主题（红/黑）
- **后端**：Next.js Route Handlers（全栈单体，类型端到端打通）
- **数据库**：Prisma ORM + **Postgres**（Neon / Vercel Postgres）
- **鉴权**：Auth.js (NextAuth) Credentials 模式 — 邮箱+密码，bcrypt 加密，httpOnly cookie session
- **文件存储**：**@vercel/blob**（作品截图、封面、PDF/PPT 附件）
- **部署**：Vercel
- **包管理**：pnpm

### 环境变量

| 变量 | 用途 |
|------|------|
| `DATABASE_URL` | Postgres 连接串 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写令牌 |
| `AUTH_SECRET` | Auth.js session 加密密钥 |

## 3. 角色

| 角色 | 说明 |
|------|------|
| `participant` | 参赛者：提报项目、报名组队、提交作品、查看成绩 |
| `judge` | 评委：登入评委后台，对作品多维度打分 |
| `admin` | 管理员：管理全站，控制赛事阶段，发布结果 |

注册默认 `participant`；评委与管理员由管理员在后台设置/创建。

## 4. 赛事生命周期

管理员控制「当前赛事」的阶段，阶段驱动全站可执行的操作：

```
筹备中 (draft)
  → 报名组队中 (registration)      开放：提报项目 / 报名 / 审核
  → 比赛进行中 (in_progress)        开放：提交/更新作品；停止新报名
  → 评分中 (judging)               锁定作品；开放：评委打分
  → 已结束 (ended)                 公布排行榜与均分
```

后端支持多赛事（Event 表），**前端默认只展示当前赛事**（标记 `isActive` 的那一场）。

## 5. 数据模型（Prisma）

```
User
  id, name, email(unique), passwordHash, role(participant|judge|admin),
  avatarUrl?, bio?, disabled(bool), createdAt

Event                                   // 赛事
  id, name, description, phase(enum),
  isActive(bool), startAt?, endAt?,
  scoreCriteria(Json),                  // [{key,label,weight,max}]
  resultsPublished(bool), createdAt

Project                                 // 提报项目 / 队伍
  id, eventId, ownerId, title, tagline,
  description, track(string),           // AI+X 赛道
  maxMembers(int), coverImageUrl?, createdAt

Membership                              // 报名 / 组队关系
  id, projectId, userId,
  status(pending|approved|rejected),
  teamRole(owner|member), message?, createdAt
  @@unique([projectId, userId])

Submission                              // 作品（每个 Project 一份，可更新）
  id, projectId(unique), title, summary,
  repoUrl?, demoUrl?, videoUrl?,
  images(Json: string[]),               // Blob URL 数组
  attachments(Json: {name,url}[]),
  updatedAt, createdAt

JudgeAssignment                         // 评委↔作品分配（可选）
  id, eventId, judgeId, submissionId
  @@unique([judgeId, submissionId])

Score                                   // 评委打分
  id, submissionId, judgeId,
  scores(Json),                         // {creativity:8, tech:9, ...}
  total(float),                         // 加权后总分
  comment?, submittedAt
  @@unique([submissionId, judgeId])
```

**最终得分** = 该作品所有评委 `total` 的算术平均（V1 用平均；去极值留作后续增强）。

## 6. 页面结构

### 公开 / 参赛者前台

| 路由 | 页面 |
|------|------|
| `/` | 首页：赛事 Hero、赛程时间轴、赛道、奖项、CTA |
| `/projects` | 项目广场：卡片列表，按赛道/状态筛选 + 搜索 |
| `/projects/[id]` | 项目详情：介绍、成员、剩余名额、报名按钮 |
| `/projects/new` | 提报项目表单（含封面上传） |
| `/dashboard` | 我的工作台（见下） |
| `/login` `/register` | 登录 / 注册 |

**工作台 `/dashboard` 分区**：
- 我发起的项目 + **待审报名列表**（通过/拒绝）
- 我加入的队伍
- 作品提交/更新入口（仅比赛进行中可用）
- 我的成绩（结果发布后显示均分与排名）

### 评委后台 `/judge`

| 路由 | 页面 |
|------|------|
| `/judge` | 待评作品列表，显示进度「已评 X / 共 Y」 |
| `/judge/[submissionId]` | 评分页：作品全貌 + 多维度评分控件 + 评语 + 提交 |

### 管理员后台 `/admin`

| 路由 | 页面 |
|------|------|
| `/admin` | 看板：用户/项目/作品/评分进度统计 |
| `/admin/users` | 用户管理：搜索、改角色、禁用 |
| `/admin/projects` | 项目与报名管理 |
| `/admin/submissions` | 作品管理 |
| `/admin/judges` | 评委管理：添加评委、分配作品 |
| `/admin/event` | 赛事设置：阶段切换、评分维度配置、发布结果 |

## 7. 关键规则与守卫

- **报名审核**：队员申请 `pending` → 发起人在工作台通过/拒绝；满员或进入「比赛进行中」后停止新报名
- **作品提交**：仅「比赛进行中」且为已 `approved` 的队伍成员可提交/更新；进入「评分中」锁定
- **评委打分**：仅「评分中」阶段可打分；各维度按 `scoreCriteria` 校验取值范围；提交后截止前可修改
- **结果发布**：管理员在「已结束」阶段 `resultsPublished=true`，前台与工作台展示排行榜
- **路由守卫**：Next.js middleware 拦截 `/admin`（admin）、`/judge`（judge）；前台敏感操作校验登录态与资源归属
- **文件上传**：服务端 Route Handler 校验类型/大小后写入 Vercel Blob，返回 URL 存库

## 8. 错误处理

- 表单：Zod 校验（前后端共用 schema），字段级错误提示
- API：统一返回 `{ ok, data | error }`，HTTP 状态码语义化（401/403/404/409/422）
- 鉴权失败重定向登录；越权返回 403
- 上传失败、阶段不允许的操作给出明确中文提示

## 9. 测试策略

- **单元**：评分加权计算、阶段-操作权限矩阵、Zod schema
- **集成（API）**：注册/登录、提报项目、报名+审核流转、作品提交锁定、打分校验
- 工具：Vitest + Prisma 测试库（独立 test schema）

## 10. 非目标（YAGNI，V1 不做）

- 邮件通知 / 站内消息
- 实时协作、WebSocket
- 去极值/复杂统计算法（先用平均分）
- 第三方/企业 SSO 登录
- 多语言（仅中文）

## 11. 里程碑（供实现计划拆分参考）

1. 脚手架 + 主题 + Prisma schema + 种子数据
2. 鉴权（注册/登录/角色守卫）
3. 项目提报 + 项目广场 + 详情
4. 报名 + 审核组队流程
5. 作品提交（含 Blob 上传）
6. 评委后台 + 多维度打分
7. 管理员后台（用户/项目/作品/评委/赛事设置）
8. 结果发布 + 排行榜 + 首页打磨
