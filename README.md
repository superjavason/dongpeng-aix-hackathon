# 东鹏 AI+X 黑客松平台

> 科技 · 艺术 · 生活 —— 一个覆盖完整赛事生命周期的黑客松平台：项目提报、自由组队（发起人审核）、作品提交、评委多维度评分、管理员后台。

基于 **Next.js 16 · TypeScript · Tailwind · Prisma · PostgreSQL · Auth.js · Vercel Blob** 构建。

## 功能概览

| 角色 | 能力 |
|------|------|
| 参赛者 | 注册登录、提报项目、浏览项目广场、报名加入队伍、在工作台审核报名、提交/更新作品、查看成绩 |
| 评委 | 评委后台浏览作品、按多维度评分表打分并写评语、查看评审进度 |
| 管理员 | 数据看板、用户管理（改角色/禁用）、项目与作品管理、评委分配、赛事阶段控制、评分维度配置、结果发布 |

**赛事阶段**（管理员控制，驱动全站行为）：
`筹备中 → 报名组队中 → 比赛进行中 → 评分中 → 已结束`

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
cp .env.example .env
```

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串（Neon / Vercel Postgres / 本地） |
| `AUTH_SECRET` | Auth.js 加密密钥：`openssl rand -base64 32` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 令牌；**本地留空** 时上传自动回落到 `public/uploads` |

> 本地若无 Postgres，可用 Docker 一键启动：
> ```bash
> docker run -d --name dp-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hackathon -p 55432:5432 postgres:16-alpine
> # 然后 DATABASE_URL="postgresql://postgres:postgres@localhost:55432/hackathon?schema=public"
> ```

### 3. 初始化数据库

```bash
pnpm db:push     # 同步表结构
pnpm db:seed     # 写入演示数据
```

### 4. 启动

```bash
pnpm dev
```

访问 http://localhost:3000

## 演示账号

密码均为 `password123`：

- 管理员：`admin@dongpeng.com`
- 评委：`judge1@dongpeng.com` / `judge2@dongpeng.com` / `judge3@dongpeng.com`
- 参赛者：`user1@dongpeng.com` … `user10@dongpeng.com`

种子数据默认处于「报名组队中」阶段。进入 **管理员后台 → 赛事设置** 切换阶段，即可依次体验作品提交（比赛进行中）、评委打分（评分中）、排行榜（已结束 + 发布结果）。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 生产启动 |
| `pnpm test` | 运行单元测试（评分/权限逻辑） |
| `pnpm db:push` | 同步 Prisma schema 到数据库（仅本地原型开发，不生成迁移） |
| `pnpm db:seed` | 写入演示数据 |
| `pnpm db:reset` | 重置数据库并重新播种（`db push --force-reset`，仅本地） |
| `pnpm db:migrate` | 开发环境：修改 schema 后生成并应用迁移（`prisma migrate dev`） |
| `pnpm db:migrate:deploy` | 生产环境：应用已提交的迁移（`prisma migrate deploy`） |
| `pnpm db:migrate:status` | 查看迁移应用状态 |
| `pnpm db:migrate:reset` | 重置数据库并重放全部迁移（仅本地） |

## 部署到 Vercel

1. 创建 Vercel 项目并接入本仓库。
2. 添加 **Vercel Postgres**（或 Neon）与 **Vercel Blob** 存储。
3. 配置环境变量 `DATABASE_URL`、`AUTH_SECRET`、`BLOB_READ_WRITE_TOKEN`。
4. 首次部署后写入演示数据：`pnpm db:seed`（可在本地连生产库执行）。

### 数据库迁移（生产用 migration，不用 db push）

生产环境用 **迁移**（migration）而非 `db push`，保证 schema 变更可版本化、可回溯、可安全重放。

- **改表结构**：修改 `prisma/schema.prisma` 后本地执行 `pnpm db:migrate`，生成的迁移文件位于 `prisma/migrations/`，随代码一起提交。
- **上线应用迁移**：构建流程保持不碰数据库，部署由人工在推送前后执行 `pnpm db:migrate:deploy`（连生产库）应用待执行迁移。
- **直连要求**：Prisma migrate 需要**直连**（非连接池）。请另配 `DIRECT_URL` 环境变量；Neon 用户把 `DATABASE_URL` 主机名里的 `-pooler` 去掉即可，本地开发可与 `DATABASE_URL` 相同。应用运行时与 Vercel 构建（`prisma generate`）不需要 `DIRECT_URL`。
- **首个迁移已基线化**：现有库（本地 + Neon 生产）此前用 `db push` 建表，已通过 `prisma migrate resolve --applied 0_init` 标记基线迁移为「已应用」，两库均 *up to date*，后续新增迁移会正常叠加。

## 技术要点

- **鉴权**：Auth.js v5 Credentials + JWT，角色写入 session；`proxy.ts`（Next.js 16 中间件，nodejs 运行时）守卫 `/admin`、`/judge`、`/dashboard`。
- **构建**：`pnpm build` 使用 webpack 构建器（`next build --webpack`）。Turbopack 生产构建在 16.2.x 存在 page-data 收集的偶发问题，开发模式（`pnpm dev`）仍默认使用 Turbopack。
- **业务规则**：阶段 × 角色 × 操作的权限矩阵集中在 `lib/permissions.ts`；评分加权在 `lib/scoring.ts`，均有单元测试。
- **评分**：多维度加权归一到 0–100；最终得分取各评委均分；修改评分维度会自动重算历史总分。
- **文件存储**：`lib/storage.ts` 封装统一接口，生产走 Vercel Blob，本地回落文件系统。

## 项目结构

```
app/
  (site)/      前台：首页 / 项目广场 / 详情 / 提报 / 工作台 / 排行榜
  (auth)/      登录 / 注册
  judge/       评委后台
  admin/       管理员后台
  api/         Route Handlers（鉴权、上传、项目、报名、作品、评分、admin）
components/     UI 组件、布局、各业务组件
lib/           db / auth / permissions / scoring / leaderboard / storage / schemas
prisma/        schema 与种子数据
```
