# 后台多场次赛事管理 — 设计文档

日期：2026-07-07
状态：已批准，待生成实施计划

## 背景与目标

当前平台按"单场赛事"运作：全站通过 `lib/event.ts` 的 `getActiveEvent()`（读取 `isActive: true` 的唯一一条 Event）来决定展示哪场赛事。数据模型（`Event → Project → Submission → Score`）本身已是按赛事隔离的，因此支持多赛事**无需数据库迁移**。

目标：在**管理后台**支持同时管理/举办多场赛事——可创建、编辑、切换、删除多场赛事，并分别查看每场赛事的项目/评委/作品/统计。

**范围边界**：公众站点、评委端、选手仪表盘**保持单活跃赛事**语义，继续使用 `getActiveEvent()`，本次不改动。多赛事能力仅存在于后台。

## 核心概念：两个独立的"当前赛事"

| 概念 | 含义 | 存储 | 数量 |
|------|------|------|------|
| **活跃赛事** | 公众/评委/选手端展示的赛事 | `Event.isActive` | 恒为 1 |
| **当前管理赛事** | 后台各页面展示的赛事 | `admin_event_id` cookie | 管理员本地选择 |

两者**相互独立**：管理员可在后台管理一场尚未上线（非活跃）或已结束的赛事，而不影响公众看到的活跃赛事。

- **单活跃不变式**：将某场设为活跃时，在事务内取消其余所有场次的 `isActive`。
- **当前管理赛事解析顺序**：`admin_event_id` cookie 指向且存在 → 该场；否则回落到活跃赛事；再否则回落到最近创建的赛事；无任何赛事时为 `null`。

## 组件设计

### 数据层：`lib/event.ts`（扩展，不破坏现有）
- 保留 `getActiveEvent()`、`getCriteria()` 不变（公众/评委/选手端继续使用）。
- 新增 `listEvents()`：返回全部赛事，含 `_count.projects`，按 `createdAt desc` 排序，供后台列表与切换器使用。
- 新增 `getAdminEvent()`：读取 `admin_event_id` cookie（`next/headers` 的 `cookies()`），校验该 id 对应的赛事是否存在；按上文解析顺序回落。返回单条 Event 或 `null`。

### 校验层：`lib/schemas.ts`
- 新增 `eventCreateSchema`：
  - `name` string 2–80（必填）
  - `description` string ≥2（必填）
  - `track` string 可选
  - `phase` enum 可选（默认 `draft`）
  - `startAt` / `endAt` ISO 字符串可选（转 `Date`）
  - `scoreCriteria` 可选；缺省时服务端写入 `DEFAULT_CRITERIA`
- 扩展 `eventUpdateSchema`：新增可选字段 `isActive: boolean`、`track: string`、`startAt`、`endAt`。

### 服务动作：`setAdminEvent(id)`（server action）
- 校验管理员身份。
- 校验 id 对应赛事存在。
- 通过 `cookies().set("admin_event_id", id)` 写入 cookie。
- `revalidatePath("/admin", "layout")` 使所有后台页面按新选择重渲染。

### API 路由
- **`POST /api/admin/event`**（新增 `app/api/admin/event/route.ts`）
  - 管理员校验；`eventCreateSchema` 解析。
  - `scoreCriteria` 缺省时用 `DEFAULT_CRITERIA`。
  - 创建赛事（默认 `isActive: false`）。返回 `{ id }`。
- **`PATCH /api/admin/event/[id]`**（扩展现有）
  - 保留现有：变更 `scoreCriteria` 时按新维度重算该赛事下全部 Score 的 `total`。
  - 新增：当 `isActive === true` 时，在同一事务内先将其余所有赛事 `isActive` 置 `false`，再将本场置 `true`（单活跃不变式）。`isActive === false` 直接更新本场。
- **`DELETE /api/admin/event/[id]`**（新增到现有 `[id]/route.ts`）
  - 管理员校验。
  - **block-if-has-projects**：若该赛事 `project.count > 0`，返回 409/422 并给出中文提示（"该赛事下仍有项目，无法删除"），**不**级联删除。
  - 仅当无项目时删除。若删除的是当前 `admin_event_id` 指向的赛事，后台下次渲染经 `getAdminEvent()` 自动回落。

### UI 组件

#### `AdminEventSwitcher`（新增，client component）
- 位于 `AdminNav` 下方的一条工具条内，横跨所有后台页面。
- 展示当前管理赛事名称 + 全部赛事下拉；活跃赛事标"活跃"徽标。
- 选择某场 → 调用 `setAdminEvent(id)` server action → 页面刷新。
- 无赛事时提示"暂无赛事，请先新建"。

#### `/admin/events` 列表页（新增，nav 项"赛事管理"）
- 表格列：名称、阶段（`PHASE_LABELS` 徽标）、是否活跃、项目数、起止时间、创建时间。
- 行操作：**管理**（设为当前管理赛事并跳 `/admin/event`）、**设为活跃**（PATCH `isActive:true`）、**删除**（block-if-has-projects，含二次确认）。
- 顶部"新建赛事"按钮 → 弹窗表单（名称、简介、赛道、初始阶段），提交 `POST /api/admin/event`。

#### `AdminNav`（修改）
- 新增导航项"赛事管理" → `/admin/events`。
- 保留"赛事设置" → `/admin/event`（现作为**当前管理赛事**的设置页）。

### 后台页面改造（`getActiveEvent` → `getAdminEvent`）
以下页面将 `getActiveEvent()` 替换为 `getAdminEvent()`，从而跟随后台切换器：
- `app/admin/page.tsx`（看板统计）
- `app/admin/projects/page.tsx`
- `app/admin/judges/page.tsx`
- `app/admin/submissions/page.tsx`
- `app/admin/event/page.tsx`（设置页）

**不改动**（继续 `getActiveEvent()`）：`app/(site)/**`、`app/judge/**`、`app/api/{projects,scores,memberships}/**` 等所有面向公众/选手/评委的路径。

## 数据流

1. 管理员在 `/admin/events` 新建赛事 → `POST /api/admin/event` → 落库（非活跃）。
2. 通过切换器或列表页"管理"选中某场 → `setAdminEvent` 写 cookie + revalidate。
3. 后台各页 `getAdminEvent()` 读 cookie → 按该赛事 `eventId` 过滤项目/作品/评委/统计。
4. "设为活跃" → `PATCH isActive:true` → 事务保证单活跃 → 公众端 `getActiveEvent()` 随之变化。

## 错误处理
- 所有 API 复用现有 `ok/fail/handleError`（`lib/api.ts`）。
- 删除受阻返回明确中文错误，前端 `toast.error` 呈现。
- `getAdminEvent()` 对失效 cookie 静默回落，绝不抛错导致后台白屏。
- 创建/更新校验失败返回 422 + 首条 zod 错误信息。

## 测试
- `lib/event.ts`：`getAdminEvent()` 回落逻辑（cookie 命中 / cookie 失效 / 无 cookie 回落活跃 / 无活跃回落最近 / 全空返回 null）单测（mock prisma 与 cookies）。
- `lib/schemas.ts`：`eventCreateSchema` 边界（name 长度、缺省 criteria）单测。
- 单活跃不变式：PATCH `isActive:true` 后仅一条活跃——集成/逻辑测试（可在事务函数层做纯函数化以便测试）。
- 沿用现有 vitest 配置。

## 非目标（YAGNI）
- 公众/评委/选手端的多赛事选择器。
- 每场赛事独立的评委账号池（评委仍全局，按作品分配）。
- 赛事复制/模板、软删除、归档。
- 删除时的级联删除（明确采用 block-if-has-projects）。
