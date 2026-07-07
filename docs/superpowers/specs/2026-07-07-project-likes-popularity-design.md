# 项目点赞与人气排行榜 — 设计文档

日期：2026-07-07

## 目标

在项目（Project）上增加点赞功能：

1. 每个登录用户在每场赛事（Event）上拥有 **10 个项目** 的点赞额度（每个项目至多 1 票）。
2. 点赞上限由后台按赛事可配置（`maxLikesPerUser`，默认 10）。
3. 排行榜页新增「人气排行榜」，按项目得票数实时公开排名。

## 关键决策（已确认）

- **额度模型**：每项目 1 票，最多可点 10 个不同项目；再次点击取消点赞回收额度。
- **开放阶段**：始终开放，任意登录用户在任意赛事阶段均可点赞（不走 `can()` 阶段权限矩阵）。
- **点赞人群**：任意登录用户；**不能** 给自己发起或已通过加入（approved member）的项目点赞。
- **人气榜可见性**：实时公开，独立于 `resultsPublished`（与专家评分榜不同）。

## 数据模型

### 新增 `ProjectLike`

```prisma
model ProjectLike {
  id        String   @id @default(cuid())
  eventId   String   // 冗余，便于按赛事统计用户已用额度
  projectId String
  userId    String
  createdAt DateTime @default(now())

  event   Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, projectId])   // 同一用户对同一项目至多 1 票
  @@index([eventId, userId])      // 统计用户在该赛事已用票数
  @@index([projectId])            // 统计项目得票数
}
```

### `Event` 新增字段

```prisma
maxLikesPerUser Int @default(10)   // 每用户每赛事点赞上限，后台可配置
```

反向关系：`User.likes ProjectLike[]`、`Project.likes ProjectLike[]`、`Event.likes ProjectLike[]`。

## 业务规则

- **额度校验**：点赞时在事务内 `count(ProjectLike where eventId + userId)`，若 `>= event.maxLikesPerUser` 拒绝（提示额度用尽）。`@@unique([userId, projectId])` 保证不重复点同一项目。
- **取消点赞**：DELETE 删除记录，回收额度。
- **禁止对象**：
  - 未登录 → 返回 401，前端引导登录。
  - 目标项目的发起人（owner）或已通过成员（approved member）→ 返回 403。
- **eventId 来源**：从 `project.eventId` 读取并写入 like 记录，保证与项目所属赛事一致。

## 后端

### `lib/likes.ts`

- `getLikeState(eventId, projectId, userId | null)` → `{ likeCount, liked, remaining, canLike }`
  - `likeCount`：该项目总票数
  - `liked`：当前用户是否已点
  - `remaining`：当前用户在该赛事剩余额度（`max - used`）
- `getPopularityRanking(eventId)` → `PopularProject[]`，按票数降序、票数相同按创建时间升序排名。

### API `app/api/projects/[id]/like/route.ts`

- `POST`：点赞。校验登录、非本人项目、额度未用尽；事务内计数后创建。返回 `{ liked: true, likeCount, remaining }`。
- `DELETE`：取消点赞。返回 `{ liked: false, likeCount, remaining }`。
- 沿用 `ok/fail/handleError` 响应约定。

### 校验

`eventUpdateSchema` 增加：

```ts
maxLikesPerUser: z.coerce.number().int().min(1).max(100).optional(),
```

## 前端

- **`components/project/like-button.tsx`（client）**：❤️ 图标 + 票数。
  - 状态：未登录（链接到 `/login?callbackUrl=`）、本人项目（禁用+说明）、额度用尽（禁用+说明）、已点/未点切换。
  - 显示「剩余 N 票」。fetch POST/DELETE + `router.refresh()` + sonner toast。
- **项目详情页** `app/(site)/projects/[id]/page.tsx`：侧栏卡片内加 `LikeButton`，服务端预取 `getLikeState`。
- **项目卡片** `components/project/project-card.tsx`：右下角只读显示 ❤️ 票数（`ProjectCardData` 增加 `likeCount`）。
- **排行榜页** `app/(site)/leaderboard/page.tsx`：改为 Tabs：
  - **人气榜**：实时公开，`getPopularityRanking`，按票数排名，展示 ❤️ 数。
  - **评分榜**：沿用现有 `resultsPublished` 门控与锁定态、专家均分排名。

## 后台

`components/admin/event-settings.tsx` 新增「人气点赞」卡片：`maxLikesPerUser` 数字输入（min 1 / max 100），复用现有 PATCH `/api/admin/event/[id]` 保存。`app/admin/event/page.tsx` 传入 `maxLikesPerUser`。

## Seed

`prisma/seed.ts`：在 `deleteMany` 序列中加入 `prisma.projectLike.deleteMany()`，避免重置时残留。（可选：为演示赛事随机播种少量点赞。）

## 测试

- `lib/likes.test.ts`：额度耗尽拒绝、取消回收、本人项目禁止、人气排名排序与并列 tie-break。
- 复用 vitest（现有 `lib/*.test.ts` 模式）。

## 不做（YAGNI）

- 不做多票投同一项目、不做匿名/未登录点赞、不做点赞通知、不做人气榜历史趋势。
