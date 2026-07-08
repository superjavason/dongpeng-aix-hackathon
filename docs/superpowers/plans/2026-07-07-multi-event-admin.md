# 后台多场次赛事管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在管理后台支持创建、切换、编辑、删除多场赛事，并按所选赛事查看项目/评委/作品/统计；公众/评委/选手端保持单活跃赛事不变。

**Architecture:** 数据模型已按赛事隔离，无需迁移。引入两个独立概念——"活跃赛事"（`Event.isActive`，公众端，恒为 1）与"当前管理赛事"（`admin_event_id` cookie，后台）。后台页面从 `getActiveEvent()` 改为 `getAdminEvent()`；新增赛事列表页、切换器、创建/删除 API 与单活跃不变式。

**Tech Stack:** Next.js App Router（server components + server actions）、Prisma、Zod、Vitest（node 环境，仅测 `lib/**/*.test.ts` 纯函数）、Tailwind、Radix UI、sonner。

## Global Constraints

- 包管理器用 `pnpm`，不用 `npm`。
- API 统一用 `lib/api.ts` 的 `ok(data)` / `fail(msg, status)` / `handleError(e)`。
- 管理员校验：API/route 用 `getAdminUser()`（`lib/admin.ts`，非管理员返回 `null` → `fail("无权限", 403)`）；server action 同样用 `getAdminUser()` 并在为 `null` 时 `throw`。
- 所有面向用户文案为简体中文。
- 阶段枚举值：`draft | registration | in_progress | judging | ended`；标签取自 `PHASE_LABELS`（`lib/constants.ts`）。
- 测试仅覆盖纯函数（仓库现状：`lib/**/*.test.ts`，node 环境，不 mock prisma）。API 路由与 React 组件通过 `pnpm build`（含 `tsc`）验证类型，功能手动验证。
- **删除策略：block-if-has-projects**——赛事下有项目时禁止删除，不级联。
- 公众/评委/选手端（`app/(site)/**`、`app/judge/**`、`app/api/{projects,scores,memberships}/**`）**不得**改动，继续用 `getActiveEvent()`。

---

## File Structure

- `lib/event.ts`（改）— 新增 `EventLike` 类型、`resolveAdminEvent`（纯函数）、`listEvents`、`getAdminEvent`；保留 `getActiveEvent`/`getCriteria`。
- `lib/event.test.ts`（建）— 测 `resolveAdminEvent` 回落逻辑。
- `lib/schemas.ts`（改）— 新增 `eventCreateSchema`；扩展 `eventUpdateSchema`。
- `lib/schemas.test.ts`（建）— 测 `eventCreateSchema`。
- `lib/actions/admin-event.ts`（建）— `setAdminEvent` server action。
- `app/api/admin/event/route.ts`（建）— `POST` 创建赛事。
- `app/api/admin/event/[id]/route.ts`（改）— `PATCH` 增加单活跃不变式；新增 `DELETE`。
- `components/admin/event-switcher.tsx`（建）— 后台赛事切换器（client）。
- `components/admin/event-create-dialog.tsx`（建）— 新建赛事弹窗（client）。
- `app/admin/events/page.tsx`（建）— 赛事列表页。
- `components/layout/admin-nav.tsx`（改）— 增加"赛事管理"导航项。
- `app/admin/layout.tsx`（改）— 在 `AdminNav` 下渲染切换器条。
- `app/admin/page.tsx`、`app/admin/projects/page.tsx`、`app/admin/judges/page.tsx`、`app/admin/submissions/page.tsx`、`app/admin/event/page.tsx`（改）— `getActiveEvent()` → `getAdminEvent()`。

---

## Task 1: `resolveAdminEvent` 纯函数回落逻辑

**Files:**
- Modify: `lib/event.ts`
- Test: `lib/event.test.ts`（建）

**Interfaces:**
- Produces:
  - `export type EventLike = { id: string; isActive: boolean }`
  - `export function resolveAdminEvent<T extends EventLike>(cookieId: string | null | undefined, events: T[]): T | null` — `events` 假定已按 `createdAt desc` 排序（第 0 个为最近）。解析顺序：cookieId 命中 events 中某条 → 该条；否则 events 中 `isActive` 者 → 该条；否则 events[0]；events 为空 → `null`。

- [ ] **Step 1: 写失败测试**

在 `lib/event.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import { resolveAdminEvent, type EventLike } from "./event";

const events: EventLike[] = [
  { id: "c", isActive: false }, // 最近
  { id: "b", isActive: true },
  { id: "a", isActive: false },
];

describe("resolveAdminEvent", () => {
  it("cookie 命中则返回该场", () => {
    expect(resolveAdminEvent("a", events)?.id).toBe("a");
  });

  it("cookie 失效则回落到活跃场", () => {
    expect(resolveAdminEvent("zzz", events)?.id).toBe("b");
  });

  it("无 cookie 则回落到活跃场", () => {
    expect(resolveAdminEvent(null, events)?.id).toBe("b");
  });

  it("无活跃场则回落到最近创建（第 0 个）", () => {
    const noActive: EventLike[] = [
      { id: "c", isActive: false },
      { id: "a", isActive: false },
    ];
    expect(resolveAdminEvent(undefined, noActive)?.id).toBe("c");
  });

  it("空列表返回 null", () => {
    expect(resolveAdminEvent("a", [])).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test lib/event.test.ts`
Expected: FAIL（`resolveAdminEvent` 未导出 / 未定义）

- [ ] **Step 3: 实现纯函数**

在 `lib/event.ts` 顶部（现有 import 之后）加入：

```typescript
export type EventLike = { id: string; isActive: boolean };

/** 后台"当前管理赛事"回落逻辑（events 需按 createdAt desc 排序）。 */
export function resolveAdminEvent<T extends EventLike>(
  cookieId: string | null | undefined,
  events: T[]
): T | null {
  if (events.length === 0) return null;
  if (cookieId) {
    const hit = events.find((e) => e.id === cookieId);
    if (hit) return hit;
  }
  const active = events.find((e) => e.isActive);
  if (active) return active;
  return events[0];
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test lib/event.test.ts`
Expected: PASS（5 passed）

- [ ] **Step 5: 提交**

```bash
git add lib/event.ts lib/event.test.ts
git commit -m "feat: add resolveAdminEvent fallback logic"
```

---

## Task 2: `listEvents` 与 `getAdminEvent` 数据访问

**Files:**
- Modify: `lib/event.ts`

**Interfaces:**
- Consumes: `resolveAdminEvent`（Task 1）。
- Produces:
  - `export async function listEvents()` — 返回全部赛事，含 `_count: { projects }`，按 `createdAt desc`。
  - `export async function getAdminEvent()` — 读 `admin_event_id` cookie，经 `resolveAdminEvent` 回落，返回单条 `Event | null`。

- [ ] **Step 1: 补充 import**

`lib/event.ts` 顶部现有 import 后加入：

```typescript
import { cookies } from "next/headers";

export const ADMIN_EVENT_COOKIE = "admin_event_id";
```

- [ ] **Step 2: 实现 `listEvents` 与 `getAdminEvent`**

在 `lib/event.ts` 末尾追加：

```typescript
/** 全部赛事（含项目数），按创建时间倒序。供后台列表与切换器使用。 */
export async function listEvents() {
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });
}

/** 后台"当前管理赛事"：读 cookie 并回落。公众端请勿使用，请用 getActiveEvent。 */
export async function getAdminEvent() {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(ADMIN_EVENT_COOKIE)?.value ?? null;
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
  return resolveAdminEvent(cookieId, events);
}
```

- [ ] **Step 3: 类型检查通过**

Run: `pnpm exec tsc --noEmit`
Expected: 无与 `lib/event.ts` 相关的报错。

- [ ] **Step 4: 提交**

```bash
git add lib/event.ts
git commit -m "feat: add listEvents and getAdminEvent accessors"
```

---

## Task 3: 赛事创建/更新校验 schema

**Files:**
- Modify: `lib/schemas.ts`
- Test: `lib/schemas.test.ts`（建）

**Interfaces:**
- Produces:
  - `export const eventCreateSchema` — 解析 `{ name, description, track?, phase?, startAt?, endAt?, scoreCriteria? }`。
  - `eventUpdateSchema` 扩展：新增可选 `isActive`、`track`、`startAt`、`endAt`。

- [ ] **Step 1: 写失败测试**

在 `lib/schemas.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import { eventCreateSchema } from "./schemas";

describe("eventCreateSchema", () => {
  it("接受最小合法输入并默认 phase=draft", () => {
    const parsed = eventCreateSchema.parse({
      name: "第二届黑客松",
      description: "面向全体员工",
    });
    expect(parsed.phase).toBe("draft");
    expect(parsed.track).toBeUndefined();
  });

  it("name 少于 2 字符时拒绝", () => {
    const r = eventCreateSchema.safeParse({ name: "x", description: "有效描述" });
    expect(r.success).toBe(false);
  });

  it("接受可选 track 与 phase", () => {
    const parsed = eventCreateSchema.parse({
      name: "赛事A",
      description: "描述内容",
      track: "AI应用",
      phase: "registration",
    });
    expect(parsed.track).toBe("AI应用");
    expect(parsed.phase).toBe("registration");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test lib/schemas.test.ts`
Expected: FAIL（`eventCreateSchema` 未导出）

- [ ] **Step 3: 新增/扩展 schema**

在 `lib/schemas.ts` 的 `eventUpdateSchema` 定义**之后**追加 `eventCreateSchema`：

```typescript
export const eventCreateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(2),
  track: z.string().max(80).optional(),
  phase: z
    .enum(["draft", "registration", "in_progress", "judging", "ended"])
    .default("draft"),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  scoreCriteria: z.array(criterionSchema).min(1).optional(),
});
```

并将现有 `eventUpdateSchema` 替换为扩展版（新增末 4 个字段）：

```typescript
export const eventUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(2).optional(),
  phase: z
    .enum(["draft", "registration", "in_progress", "judging", "ended"])
    .optional(),
  scoreCriteria: z.array(criterionSchema).min(1).optional(),
  resultsPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
  track: z.string().max(80).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test lib/schemas.test.ts`
Expected: PASS（3 passed）

- [ ] **Step 5: 提交**

```bash
git add lib/schemas.ts lib/schemas.test.ts
git commit -m "feat: add eventCreateSchema and extend eventUpdateSchema"
```

---

## Task 4: 赛事创建/删除/单活跃 API

**Files:**
- Create: `app/api/admin/event/route.ts`
- Modify: `app/api/admin/event/[id]/route.ts`

**Interfaces:**
- Consumes: `eventCreateSchema`、`eventUpdateSchema`（Task 3）、`getAdminUser`、`ok/fail/handleError`、`DEFAULT_CRITERIA`（`lib/constants.ts`）。
- Produces: `POST /api/admin/event`；`PATCH`（含 `isActive` 单活跃事务）；`DELETE`（block-if-has-projects）。

- [ ] **Step 1: 创建 POST 路由**

`app/api/admin/event/route.ts`：

```typescript
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { eventCreateSchema } from "@/lib/schemas";
import { DEFAULT_CRITERIA } from "@/lib/constants";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);

    const parsed = eventCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "参数有误", 422);
    }
    const { scoreCriteria, ...rest } = parsed.data;

    const event = await prisma.event.create({
      data: {
        ...rest,
        scoreCriteria: (scoreCriteria ?? DEFAULT_CRITERIA) as object,
        isActive: false,
      },
    });
    return ok({ id: event.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
```

- [ ] **Step 2: 在 PATCH 中加入单活跃不变式**

编辑 `app/api/admin/event/[id]/route.ts`。在现有 `scoreCriteria` 重算逻辑**之后**、`prisma.event.update` **之前**，插入：

```typescript
    // 单活跃不变式：设为活跃时，先取消其余所有赛事的 isActive。
    if (data.isActive === true) {
      await prisma.event.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
    }
```

（保持现有 `const event = await prisma.event.update({ where: { id }, data });` 与返回不变。）

- [ ] **Step 3: 在同文件新增 DELETE**

在 `app/api/admin/event/[id]/route.ts` 末尾追加：

```typescript
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);

    const { id } = await params;
    const projectCount = await prisma.project.count({ where: { eventId: id } });
    if (projectCount > 0) {
      return fail("该赛事下仍有项目，无法删除。请先清空项目。", 422);
    }
    await prisma.event.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
}
```

- [ ] **Step 4: 类型检查通过**

Run: `pnpm exec tsc --noEmit`
Expected: 无与这两个文件相关的报错。

- [ ] **Step 5: 提交**

```bash
git add app/api/admin/event/route.ts app/api/admin/event/[id]/route.ts
git commit -m "feat: event create/delete API and single-active invariant"
```

---

## Task 5: `setAdminEvent` server action

**Files:**
- Create: `lib/actions/admin-event.ts`

**Interfaces:**
- Consumes: `getAdminUser`、`ADMIN_EVENT_COOKIE`（Task 2）。
- Produces: `export async function setAdminEvent(id: string): Promise<void>` — 校验管理员与赛事存在，写 cookie，revalidate 后台。

- [ ] **Step 1: 实现 server action**

`lib/actions/admin-event.ts`：

```typescript
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ADMIN_EVENT_COOKIE } from "@/lib/event";

/** 设置后台"当前管理赛事"。仅管理员可调用。 */
export async function setAdminEvent(id: string): Promise<void> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("无权限");

  const exists = await prisma.event.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) throw new Error("赛事不存在");

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_EVENT_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/admin", "layout");
}
```

- [ ] **Step 2: 类型检查通过**

Run: `pnpm exec tsc --noEmit`
Expected: 无与该文件相关的报错。

- [ ] **Step 3: 提交**

```bash
git add lib/actions/admin-event.ts
git commit -m "feat: setAdminEvent server action"
```

---

## Task 6: 后台赛事切换器与布局接入

**Files:**
- Create: `components/admin/event-switcher.tsx`
- Modify: `components/layout/admin-nav.tsx`
- Modify: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: `setAdminEvent`（Task 5）、`listEvents` + `getAdminEvent`（Task 2）、`PHASE_LABELS`。
- Produces: `<EventSwitcher events={...} currentId={...} />` client 组件。

- [ ] **Step 1: 创建切换器组件**

`components/admin/event-switcher.tsx`：

```typescript
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setAdminEvent } from "@/lib/actions/admin-event";

type SwitcherEvent = { id: string; name: string; isActive: boolean };

export function EventSwitcher({
  events,
  currentId,
}: {
  events: SwitcherEvent[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (events.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        暂无赛事，请前往「赛事管理」新建。
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">当前管理</span>
      <Select
        value={currentId ?? undefined}
        disabled={pending}
        onValueChange={(id) =>
          startTransition(async () => {
            await setAdminEvent(id);
            router.refresh();
          })
        }
      >
        <SelectTrigger className="h-8 w-[220px] bg-white">
          <SelectValue placeholder="选择赛事" />
        </SelectTrigger>
        <SelectContent>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
              {e.isActive ? "（活跃）" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: 在 AdminNav 增加"赛事管理"导航项**

编辑 `components/layout/admin-nav.tsx`，在 `ITEMS` 数组中"赛事设置"项**之前**插入一行（`FolderKanban` 已导入；用 `CalendarDays` 需在 lucide import 中补充）。将 lucide import 里补上 `CalendarDays`，并插入：

```typescript
  { href: "/admin/events", label: "赛事管理", icon: CalendarDays },
```

结果 `ITEMS` 顺序：看板、用户管理、项目管理、作品管理、评委管理、**赛事管理**、赛事设置。

- [ ] **Step 3: 在 admin layout 渲染切换器条**

编辑 `app/admin/layout.tsx`，改为异步加载赛事并在 `AdminNav` 下渲染切换器：

```typescript
import { requireRole } from "@/lib/session";
import { ConsoleHeader } from "@/components/layout/console-header";
import { AdminNav } from "@/components/layout/admin-nav";
import { EventSwitcher } from "@/components/admin/event-switcher";
import { listEvents, getAdminEvent } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  const [events, current] = await Promise.all([listEvents(), getAdminEvent()]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ConsoleHeader title="AI+X黑客松大赛" accent="管理员后台" />
      <AdminNav />
      <div className="border-b bg-neutral-50">
        <div className="container flex items-center py-2">
          <EventSwitcher
            events={events.map((e) => ({
              id: e.id,
              name: e.name,
              isActive: e.isActive,
            }))}
            currentId={current?.id ?? null}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: 类型检查通过**

Run: `pnpm exec tsc --noEmit`
Expected: 无相关报错。

- [ ] **Step 5: 提交**

```bash
git add components/admin/event-switcher.tsx components/layout/admin-nav.tsx app/admin/layout.tsx
git commit -m "feat: admin event switcher in layout"
```

---

## Task 7: 赛事列表页与新建弹窗

**Files:**
- Create: `components/admin/event-create-dialog.tsx`
- Create: `app/admin/events/page.tsx`

**Interfaces:**
- Consumes: `listEvents` + `getAdminEvent`（Task 2）、`setAdminEvent`（Task 5）、`POST /api/admin/event` 与 `PATCH`/`DELETE /api/admin/event/[id]`（Task 4）、`PHASE_LABELS`、`Badge`/`Table`/`Card`/`Button`。
- Produces: `<EventCreateDialog />`；`/admin/events` 页面。

- [ ] **Step 1: 创建新建弹窗**

`components/admin/event-create-dialog.tsx`：

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EventCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/admin/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        track: track || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "创建失败");
      return;
    }
    toast.success("赛事已创建");
    setOpen(false);
    setName("");
    setDescription("");
    setTrack("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> 新建赛事
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建赛事</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-name">赛事名称</Label>
            <Input
              id="ev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：2026 第二届 AI+X 黑客松"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">简介</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="赛事背景与说明"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-track">赛道（可选）</Label>
            <Input
              id="ev-track"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="例如：AI 应用 / AI 工具"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={loading || name.length < 2}>
            {loading ? "创建中…" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 创建"设为活跃"客户端按钮**

在 `components/admin/event-create-dialog.tsx` **同文件末尾**追加一个轻量按钮组件（供列表页复用，避免新建文件）：

```typescript
export function SetActiveButton({
  eventId,
  isActive,
}: {
  eventId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isActive) {
    return (
      <Button size="sm" variant="outline" disabled>
        当前活跃
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch(`/api/admin/event/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
        const data = await res.json();
        setLoading(false);
        if (!data.ok) {
          toast.error(data.error ?? "操作失败");
          return;
        }
        toast.success("已设为活跃赛事");
        router.refresh();
      }}
    >
      {loading ? "设置中…" : "设为活跃"}
    </Button>
  );
}
```

- [ ] **Step 3: 创建列表页**

`app/admin/events/page.tsx`：

```typescript
import Link from "next/link";
import { listEvents, getAdminEvent } from "@/lib/event";
import { PHASE_LABELS } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  EventCreateDialog,
  SetActiveButton,
} from "@/components/admin/event-create-dialog";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const [events, current] = await Promise.all([listEvents(), getAdminEvent()]);

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">赛事管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {events.length} 场赛事。公众端展示「活跃」赛事，后台各页展示「当前管理」赛事。
          </p>
        </div>
        <EventCreateDialog />
      </div>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>赛事</TableHead>
              <TableHead>阶段</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>项目数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  {e.name}
                  {current?.id === e.id && (
                    <Badge variant="muted" className="ml-2">
                      管理中
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {PHASE_LABELS[e.phase]}
                </TableCell>
                <TableCell>
                  {e.isActive ? (
                    <Badge variant="success">活跃</Badge>
                  ) : (
                    <Badge variant="muted">未上线</Badge>
                  )}
                </TableCell>
                <TableCell>{e._count.projects}</TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/event">管理</Link>
                  </Button>
                  <SetActiveButton eventId={e.id} isActive={e.isActive} />
                  <DeleteButton
                    endpoint={`/api/admin/event/${e.id}`}
                    label="删除赛事"
                    description={`确认删除「${e.name}」？仅当赛事下没有项目时可删除。`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
```

注：「管理」按钮跳转 `/admin/event`（设置页展示当前管理赛事）；要先切换到该赛事，请用顶部切换器。此为有意的简化——列表页「管理」仅作为进入设置页的入口。

- [ ] **Step 4: 类型检查通过**

Run: `pnpm exec tsc --noEmit`
Expected: 无相关报错。

- [ ] **Step 5: 提交**

```bash
git add components/admin/event-create-dialog.tsx app/admin/events/page.tsx
git commit -m "feat: admin events list page with create/set-active/delete"
```

---

## Task 8: 后台各页改用 `getAdminEvent`

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/projects/page.tsx`
- Modify: `app/admin/judges/page.tsx`
- Modify: `app/admin/submissions/page.tsx`
- Modify: `app/admin/event/page.tsx`

**Interfaces:**
- Consumes: `getAdminEvent`（Task 2）。

- [ ] **Step 1: 替换 5 个后台页面的事件来源**

在以上每个文件中：
1. 将 `import { getActiveEvent } from "@/lib/event";` 改为 `import { getAdminEvent } from "@/lib/event";`（`app/admin/event/page.tsx` 为 `import { getAdminEvent, getCriteria } from "@/lib/event";`）。
2. 将该文件内的 `await getActiveEvent()` 调用改为 `await getAdminEvent()`。

其余逻辑（`event.id` 过滤、`event` 为 null 的兜底）保持不变。

- [ ] **Step 2: 确认无遗漏**

Run: `grep -rn "getActiveEvent" app/admin`
Expected: 无输出（后台已全部切换）。

Run: `grep -rln "getActiveEvent" app/(site) app/judge app/api`
Expected: 仍有输出（公众/评委/选手/API 端未改动，符合预期）。

- [ ] **Step 3: 全量构建验证**

Run: `pnpm build`
Expected: 构建成功，无类型错误。

- [ ] **Step 4: 提交**

```bash
git add app/admin/page.tsx app/admin/projects/page.tsx app/admin/judges/page.tsx app/admin/submissions/page.tsx app/admin/event/page.tsx
git commit -m "feat: admin pages follow selected event via getAdminEvent"
```

---

## Task 9: 端到端手动验证

**Files:** 无（验证任务）

- [ ] **Step 1: 启动并走查**

Run: `pnpm dev`，以管理员登录后依次验证：
1. `/admin/events`：显示现有赛事；「新建赛事」创建一场新赛事 → 列表新增、状态「未上线」。
2. 顶部切换器切到新赛事 → `/admin/projects`、`/admin/submissions`、`/admin/judges`、`/admin` 统计均显示该赛事（新赛事应为空）。
3. `/admin/events` 对新赛事点「设为活跃」→ 原活跃赛事变「未上线」，仅一场「活跃」。
4. 公众首页 `/`：展示新设为活跃的赛事（验证 `getActiveEvent` 生效）。
5. 删除：对有项目的赛事点删除 → toast 报「仍有项目，无法删除」；对空的新赛事删除 → 成功移除。

- [ ] **Step 2: 运行全部单测**

Run: `pnpm test`
Expected: 全部通过（含新增 `event.test.ts`、`schemas.test.ts` 与既有测试）。

---

## Self-Review

**Spec coverage：**
- 两概念（活跃 vs 当前管理）→ Task 1/2/5（cookie + 回落 + action）✓
- `listEvents`/`getAdminEvent`/`resolveAdminEvent` → Task 1/2 ✓
- `eventCreateSchema` + 扩展 `eventUpdateSchema` → Task 3 ✓
- POST 创建 / PATCH 单活跃 / DELETE block-if-has-projects → Task 4 ✓
- `setAdminEvent` server action → Task 5 ✓
- 切换器 + layout 接入 + nav 项 → Task 6 ✓
- `/admin/events` 列表 + 新建弹窗 + 设为活跃 + 删除 → Task 7 ✓
- 5 个后台页改 `getAdminEvent` → Task 8 ✓
- 公众/评委/选手端不改动 → Task 8 Step 2 显式校验 ✓
- 测试（回落逻辑、schema 边界）→ Task 1/3 ✓

**Placeholder scan：** 无 TBD/TODO；每处代码步骤均含完整代码。

**Type consistency：** `resolveAdminEvent`/`EventLike`/`ADMIN_EVENT_COOKIE`/`listEvents`/`getAdminEvent`/`setAdminEvent`/`eventCreateSchema` 在定义与消费处名称一致；`EventSwitcher`/`EventCreateDialog`/`SetActiveButton` props 与调用处一致。DELETE 复用 `DeleteButton`（DELETE 方法、`data.ok` 契约）与现有一致。
