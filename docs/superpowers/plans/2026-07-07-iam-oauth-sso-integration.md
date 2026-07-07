# IAM OAuth2.0 (CAS) SSO Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DongPeng IAM OAuth2.0 (CAS `esc-sso`) enterprise single-sign-on as an internal-employee login/registration method, coexisting with the existing email/password flow.

**Architecture:** Self-built two-route OAuth authorization-code dance (`/api/sso/iam/start` → IAM → `/api/sso/iam/callback`), with session minting delegated to a hidden `iam` NextAuth Credentials provider whose `authorize` exchanges the one-time `code` for the IAM profile and JIT-provisions a local user keyed on a new `ssoId` column. The whole feature is env-gated: absent IAM config → provider disabled and login button hidden.

**Tech Stack:** Next.js 16 (App Router), NextAuth v5 beta.25 (JWT strategy), Prisma + Postgres, Vitest (node env), pnpm.

## Global Constraints

- Package manager: **pnpm only** (never `npm`).
- UI copy: **Chinese**, matching existing tone.
- Session strategy stays **JWT** (Credentials requires it); do NOT wire the Prisma adapter.
- IAM endpoint path segment is **`esc-sso`** (the doc's `escsso` is a line-wrap artifact): `${IAM_BASE_URL}/oauth2.0/{authorize,accessToken,profile}` where `IAM_BASE_URL` already includes `/esc-sso`.
- JIT-provisioned SSO users default to role **`participant`**.
- Feature is **env-gated**: `IAM_CLIENT_ID` absent → provider disabled; `NEXT_PUBLIC_IAM_ENABLED` unset → login button hidden. Vercel demo sets none of these.
- Spec: `docs/superpowers/specs/2026-07-07-iam-oauth-sso-integration-design.md`.

## File Structure

- `prisma/schema.prisma` — modify `User`: `email` and `passwordHash` → nullable; add `ssoId String? @unique`.
- `lib/iam.ts` — **create**: all IAM logic (config, URL building, token parsing, profile mapping, code→profile exchange with mock support, JIT upsert, safe-path helper).
- `lib/iam.test.ts` — **create**: unit tests for the pure helpers.
- `auth.ts` — modify: add hidden `iam` Credentials provider; add `passwordHash` null-guard to the existing credentials provider.
- `app/api/sso/iam/start/route.ts` — **create**: builds authorize URL, sets state cookie, redirects (or short-circuits to callback in mock mode).
- `app/api/sso/iam/callback/route.ts` — **create**: validates state, delegates to `signIn("iam", …)`.
- `app/(auth)/login/page.tsx` — modify: conditional IAM login button.
- `app/admin/users/page.tsx`, `app/admin/projects/[id]/page.tsx` — modify: null-guard email displays.
- `.env.example` — modify: document IAM variables.

---

### Task 1: Make User model nullable-safe (schema + guards)

Relax `email`/`passwordHash` to nullable, add `ssoId`, and immediately guard every place that assumed they were non-null, so the existing email/password flow keeps working unchanged.

**Files:**
- Modify: `prisma/schema.prisma` (User model)
- Modify: `auth.ts` (existing credentials `authorize`)
- Modify: `app/admin/users/page.tsx:53`
- Modify: `app/admin/projects/[id]/page.tsx:139` and `:159`

**Interfaces:**
- Produces: `User.ssoId` (nullable unique String), `User.email` (nullable), `User.passwordHash` (nullable) — consumed by Tasks 2–4.

- [ ] **Step 1: Edit the Prisma schema**

In `prisma/schema.prisma`, change the three `User` fields:

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String?  @unique
  passwordHash String?
  ssoId        String?  @unique
  role         Role     @default(participant)
  avatarUrl    String?
  bio          String?
  disabled     Boolean  @default(false)
  createdAt    DateTime @default(now())

  ownedProjects Project[]          @relation("ProjectOwner")
  memberships   Membership[]
  assignments   JudgeAssignment[]
  scores        Score[]
}
```

- [ ] **Step 2: Push schema and regenerate client**

Run:
```bash
pnpm db:push && pnpm db:generate
```
Expected: `db push` reports the columns altered/added with no data loss; `prisma generate` succeeds. (Relaxing NOT NULL and adding a nullable column is non-destructive; existing rows keep their emails.)

- [ ] **Step 3: Guard the existing credentials authorize**

In `auth.ts`, inside the existing `Credentials` provider's `authorize`, add a guard right after the `disabled` check and before `bcrypt.compare`:

```ts
const user = await prisma.user.findUnique({ where: { email } });
if (!user || user.disabled) return null;
if (!user.passwordHash) return null; // SSO-only 用户无密码，禁止密码登录路径

const valid = await bcrypt.compare(password, user.passwordHash);
if (!valid) return null;
```

- [ ] **Step 4: Null-guard email displays**

`app/admin/users/page.tsx` line 53:
```tsx
<TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
```

`app/admin/projects/[id]/page.tsx` line 139:
```tsx
<InfoRow label="发起人" value={`${project.owner.name}${project.owner.email ? ` · ${project.owner.email}` : ""}`} />
```

`app/admin/projects/[id]/page.tsx` line 159:
```tsx
<p className="truncate text-xs text-muted-foreground">{m.user.email ?? "—"}</p>
```

- [ ] **Step 5: Verify nothing regressed**

Run:
```bash
pnpm test && pnpm exec tsc --noEmit
```
Expected: all existing tests pass; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma auth.ts "app/admin/users/page.tsx" "app/admin/projects/[id]/page.tsx"
git commit -m "feat(auth): make User email/passwordHash nullable, add ssoId column"
```

---

### Task 2: IAM helper module with unit tests

All pure/isolated IAM logic lives in `lib/iam.ts`. Pure helpers are TDD'd in `lib/iam.test.ts` (Vitest only collects `lib/**/*.test.ts`). The network/DB functions live in the same module but are exercised end-to-end in Task 5's mock run.

**Files:**
- Create: `lib/iam.ts`
- Create: `lib/iam.test.ts`

**Interfaces:**
- Produces:
  - `isIamEnabled(): boolean`
  - `getIamConfig(): IamConfig` where `IamConfig = { baseUrl: string; clientId: string; clientSecret: string; redirectUri: string; mock: boolean }`
  - `buildAuthorizeUrl(cfg: IamConfig, state: string): string`
  - `parseAccessToken(raw: string): string | null`
  - `mapProfile(data: unknown): IamProfile | null` where `IamProfile = { ssoId: string; accountNo: string | null }`
  - `safeInternalPath(path: string | null | undefined, fallback: string): string`
  - `exchangeCodeForProfile(code: string): Promise<IamProfile | null>`
  - `findOrCreateSsoUser(profile: IamProfile): Promise<User | null>`
- Consumes: `User.ssoId` from Task 1.

- [ ] **Step 1: Write the failing tests**

Create `lib/iam.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseAccessToken,
  mapProfile,
  safeInternalPath,
  buildAuthorizeUrl,
  isIamEnabled,
  type IamConfig,
} from "@/lib/iam";

const cfg: IamConfig = {
  baseUrl: "https://iam.dongpeng.net/esc-sso",
  clientId: "cid",
  clientSecret: "secret",
  redirectUri: "https://app.example.com/api/sso/iam/callback",
  mock: false,
};

describe("parseAccessToken", () => {
  it("parses CAS form format", () => {
    expect(parseAccessToken("access_token=a855d95f1974&expires=7200")).toBe("a855d95f1974");
  });
  it("falls back to JSON format", () => {
    expect(parseAccessToken('{"access_token":"abc123"}')).toBe("abc123");
  });
  it("returns null when absent", () => {
    expect(parseAccessToken("error=invalid_grant")).toBeNull();
    expect(parseAccessToken("")).toBeNull();
  });
});

describe("mapProfile", () => {
  it("maps id and account_no", () => {
    expect(
      mapProfile({ id: "sysadmin", attributes: { account_no: "sysadmintest" } })
    ).toEqual({ ssoId: "sysadmin", accountNo: "sysadmintest" });
  });
  it("tolerates missing attributes", () => {
    expect(mapProfile({ id: "sysadmin" })).toEqual({ ssoId: "sysadmin", accountNo: null });
  });
  it("rejects payload without id", () => {
    expect(mapProfile({ attributes: { account_no: "x" } })).toBeNull();
    expect(mapProfile(null)).toBeNull();
    expect(mapProfile("nope")).toBeNull();
  });
});

describe("safeInternalPath", () => {
  it("accepts internal absolute paths", () => {
    expect(safeInternalPath("/dashboard", "/x")).toBe("/dashboard");
  });
  it("rejects protocol-relative and external", () => {
    expect(safeInternalPath("//evil.com", "/x")).toBe("/x");
    expect(safeInternalPath("https://evil.com", "/x")).toBe("/x");
    expect(safeInternalPath(null, "/x")).toBe("/x");
  });
});

describe("buildAuthorizeUrl", () => {
  it("includes required oauth params", () => {
    const url = buildAuthorizeUrl(cfg, "state123");
    expect(url).toContain("https://iam.dongpeng.net/esc-sso/oauth2.0/authorize?");
    expect(url).toContain("client_id=cid");
    expect(url).toContain("response_type=code");
    expect(url).toContain("state=state123");
    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fsso%2Fiam%2Fcallback"
    );
  });
});

describe("isIamEnabled", () => {
  const original = process.env.IAM_CLIENT_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.IAM_CLIENT_ID;
    else process.env.IAM_CLIENT_ID = original;
  });
  it("true when client id present", () => {
    process.env.IAM_CLIENT_ID = "x";
    expect(isIamEnabled()).toBe(true);
  });
  it("false when absent", () => {
    delete process.env.IAM_CLIENT_ID;
    expect(isIamEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
pnpm exec vitest run lib/iam.test.ts
```
Expected: FAIL — cannot resolve `@/lib/iam` (module does not exist yet).

- [ ] **Step 3: Implement `lib/iam.ts`**

Create `lib/iam.ts`:

```ts
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

const OAUTH_PATH = "/oauth2.0";

export interface IamConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  mock: boolean;
}

export interface IamProfile {
  ssoId: string;
  accountNo: string | null;
}

export function isIamEnabled(): boolean {
  return Boolean(process.env.IAM_CLIENT_ID);
}

export function getIamConfig(): IamConfig {
  const clientId = process.env.IAM_CLIENT_ID;
  const clientSecret = process.env.IAM_CLIENT_SECRET;
  const baseUrl = process.env.IAM_BASE_URL;
  const authUrl = process.env.AUTH_URL;
  if (!clientId || !clientSecret || !baseUrl || !authUrl) {
    throw new Error(
      "IAM 未正确配置：需要 IAM_CLIENT_ID / IAM_CLIENT_SECRET / IAM_BASE_URL / AUTH_URL"
    );
  }
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    clientId,
    clientSecret,
    redirectUri: `${authUrl.replace(/\/+$/, "")}/api/sso/iam/callback`,
    mock: process.env.IAM_MOCK === "true",
  };
}

export function buildAuthorizeUrl(cfg: IamConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: "code",
    redirect_uri: cfg.redirectUri,
    state,
  });
  return `${cfg.baseUrl}${OAUTH_PATH}/authorize?${params.toString()}`;
}

export function parseAccessToken(raw: string): string | null {
  const fromForm = new URLSearchParams(raw).get("access_token");
  if (fromForm) return fromForm;
  try {
    const json = JSON.parse(raw) as { access_token?: unknown };
    if (typeof json.access_token === "string") return json.access_token;
  } catch {
    // not JSON — ignore
  }
  return null;
}

export function mapProfile(data: unknown): IamProfile | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.id !== "string" || obj.id.length === 0) return null;
  const attributes = obj.attributes as Record<string, unknown> | undefined;
  const accountNo =
    attributes && typeof attributes.account_no === "string"
      ? attributes.account_no
      : null;
  return { ssoId: obj.id, accountNo };
}

export function safeInternalPath(
  path: string | null | undefined,
  fallback: string
): string {
  if (typeof path === "string" && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return fallback;
}

export async function exchangeCodeForProfile(
  code: string
): Promise<IamProfile | null> {
  const cfg = getIamConfig();
  if (cfg.mock) {
    return { ssoId: "mock-sso-id", accountNo: "mockuser" };
  }
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    redirect_uri: cfg.redirectUri,
  });
  const tokenRes = await fetch(
    `${cfg.baseUrl}${OAUTH_PATH}/accessToken?${tokenParams.toString()}`,
    { method: "POST" }
  );
  if (!tokenRes.ok) return null;
  const accessToken = parseAccessToken(await tokenRes.text());
  if (!accessToken) return null;

  const profileRes = await fetch(
    `${cfg.baseUrl}${OAUTH_PATH}/profile?access_token=${encodeURIComponent(accessToken)}`,
    { method: "GET" }
  );
  if (!profileRes.ok) return null;
  return mapProfile(await profileRes.json());
}

export async function findOrCreateSsoUser(
  profile: IamProfile
): Promise<User | null> {
  const user = await prisma.user.upsert({
    where: { ssoId: profile.ssoId },
    create: {
      ssoId: profile.ssoId,
      name: profile.accountNo ?? profile.ssoId,
      role: "participant",
    },
    update: {},
  });
  if (user.disabled) return null;
  return user;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
pnpm exec vitest run lib/iam.test.ts
```
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/iam.ts lib/iam.test.ts
git commit -m "feat(auth): add IAM helper module (config, token parse, profile map, JIT upsert)"
```

---

### Task 3: Hidden `iam` Credentials provider

Add the second provider that turns a one-time IAM `code` into a NextAuth JWT session. Security rests on `code` being IAM-issued and single-use: a forged POST to `/api/auth/callback/iam` can't produce a valid code, so token exchange fails and login is rejected.

**Files:**
- Modify: `auth.ts`

**Interfaces:**
- Consumes: `exchangeCodeForProfile`, `findOrCreateSsoUser` from Task 2.
- Produces: provider id `"iam"` accepting credential fields `{ code, redirectTo }`, consumed by Task 4's `signIn("iam", …)`.

- [ ] **Step 1: Add imports and the provider**

In `auth.ts`, add to the imports:

```ts
import { exchangeCodeForProfile, findOrCreateSsoUser } from "@/lib/iam";
```

Add a second entry to the `providers` array (after the existing `Credentials({...})`):

```ts
    Credentials({
      id: "iam",
      name: "IAM SSO",
      credentials: {
        code: { label: "code", type: "text" },
      },
      async authorize(credentials) {
        const code = typeof credentials?.code === "string" ? credentials.code : null;
        if (!code) return null;

        const profile = await exchangeCodeForProfile(code);
        if (!profile) return null;

        const user = await findOrCreateSsoUser(profile);
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
```

- [ ] **Step 2: Verify typecheck**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: clean. (The `jwt`/`session` callbacks in `auth.config.ts` already read `user.id`/`user.role`, so the returned shape flows through unchanged.)

- [ ] **Step 3: Commit**

```bash
git add auth.ts
git commit -m "feat(auth): add hidden iam Credentials provider for SSO session minting"
```

---

### Task 4: OAuth start + callback routes

Two GET route handlers implement the browser-facing dance. In mock mode, `start` skips the external IAM redirect and points straight back at `callback`, so the whole loop runs offline.

**Files:**
- Create: `app/api/sso/iam/start/route.ts`
- Create: `app/api/sso/iam/callback/route.ts`

**Interfaces:**
- Consumes: `isIamEnabled`, `getIamConfig`, `buildAuthorizeUrl`, `safeInternalPath` from Task 2; `signIn` from `@/auth`; provider `"iam"` from Task 3.

- [ ] **Step 1: Create the start route**

Create `app/api/sso/iam/start/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import {
  isIamEnabled,
  getIamConfig,
  buildAuthorizeUrl,
  safeInternalPath,
} from "@/lib/iam";

export async function GET(req: NextRequest) {
  if (!isIamEnabled()) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const cfg = getIamConfig();
  const state = randomUUID();
  const callbackUrl = safeInternalPath(
    req.nextUrl.searchParams.get("callbackUrl"),
    ""
  );

  const target = cfg.mock
    ? `${cfg.redirectUri}?code=mock-code&state=${encodeURIComponent(state)}`
    : buildAuthorizeUrl(cfg, state);

  const res = NextResponse.redirect(target);
  res.cookies.set("iam_oauth_state", JSON.stringify({ state, callbackUrl }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
  return res;
}
```

- [ ] **Step 2: Create the callback route**

Create `app/api/sso/iam/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/auth";
import { safeInternalPath } from "@/lib/iam";

function isNextRedirect(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  let stored: { state?: string; callbackUrl?: string } = {};
  const raw = req.cookies.get("iam_oauth_state")?.value;
  try {
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  if (!state || !stored.state || state !== stored.state) {
    return NextResponse.redirect(new URL("/login?error=sso_state", req.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=sso_code", req.url));
  }

  const redirectTo = safeInternalPath(stored.callbackUrl || null, "/dashboard");

  try {
    // signIn 执行 iam authorize，成功后设置会话 cookie 并抛出 NEXT_REDIRECT 完成跳转
    return await signIn("iam", { code, redirectTo });
  } catch (e) {
    if (isNextRedirect(e)) throw e; // 让 Next 处理成功后的重定向
    return NextResponse.redirect(new URL("/login?error=sso_failed", req.url));
  }
}
```

> **Verification-gated mechanic:** If Task 5's mock run shows the browser lands on `/dashboard` but the session is NOT set (still logged out), switch the `signIn` call to the explicit form: `await signIn("iam", { code, redirect: false });` followed by `return NextResponse.redirect(new URL(redirectTo, req.url));`. Keep the state-cookie validation above unchanged either way.

- [ ] **Step 3: Verify typecheck**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/api/sso/iam/start/route.ts app/api/sso/iam/callback/route.ts
git commit -m "feat(auth): add IAM oauth start + callback routes (mock-aware)"
```

---

### Task 5: Login button, env docs, and offline mock end-to-end verification

Add the conditional UI entry point, document the env vars, then drive the full `start → callback → JIT user → session → /dashboard` loop with `IAM_MOCK=true` and no network.

**Files:**
- Modify: `app/(auth)/login/page.tsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: start route from Task 4; `NEXT_PUBLIC_IAM_ENABLED` env.

- [ ] **Step 1: Add the conditional IAM button**

In `app/(auth)/login/page.tsx`, inside `LoginForm`, add after the closing `</form>` and before the "还没有账号？" paragraph:

```tsx
      {process.env.NEXT_PUBLIC_IAM_ENABLED === "true" && (
        <div className="mt-6">
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t" />
            <span className="mx-3 text-xs text-muted-foreground">或</span>
            <div className="flex-grow border-t" />
          </div>
          <a
            href={`/api/sso/iam/start${
              callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
            }`}
            className="block"
          >
            <Button type="button" variant="outline" className="mt-3 w-full" size="lg">
              东鹏企业登录（IAM）
            </Button>
          </a>
        </div>
      )}
```

(`callbackUrl` is already read from `useSearchParams` at the top of `LoginForm`.)

- [ ] **Step 2: Document env vars**

Append to `.env.example`:

```
# ── 东鹏 IAM 企业单点登录（OAuth2.0 / CAS）──
# 仅内网可达；Vercel 演示环境请全部留空（自动隐藏入口）。
# 测试环境 IAM_BASE_URL=https://iamtest.dongpeng.net/esc-sso
IAM_BASE_URL="https://iam.dongpeng.net/esc-sso"
IAM_CLIENT_ID=""          # 生产 8f182297edf39c401388 / 测试 74c5ecf39649fc45fce8
IAM_CLIENT_SECRET=""      # 由 SSO 项目组提供
AUTH_URL=""               # 本部署对外域名，用于拼 redirect_uri，如 https://aix-hackathon.dongpeng.net
NEXT_PUBLIC_IAM_ENABLED="" # 设为 "true" 时登录页显示 IAM 按钮
IAM_MOCK=""               # 设为 "true" 时本地无网络联调（短路 token/profile 与授权跳转）
```

- [ ] **Step 3: Configure a local mock env**

Create/append `.env.local` (git-ignored) with:

```
IAM_BASE_URL="https://iam.dongpeng.net/esc-sso"
IAM_CLIENT_ID="dummy"
IAM_CLIENT_SECRET="dummy"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_IAM_ENABLED="true"
IAM_MOCK="true"
```

- [ ] **Step 4: Run the app and drive the full loop offline**

Run:
```bash
pnpm dev
```
Then in a browser:
1. Open `http://localhost:3000/login` → confirm the **东鹏企业登录（IAM）** button renders.
2. Click it (or open `http://localhost:3000/api/sso/iam/start`).

Expected: because `IAM_MOCK=true`, `/start` redirects to `/api/sso/iam/callback?code=mock-code&state=…`, the `iam` provider mints a session for the mock profile, and the browser lands **logged in on `/dashboard`**. If instead you land on `/dashboard` while still logged out, apply the fallback noted in Task 4 Step 2 and re-run.

- [ ] **Step 5: Confirm the JIT user was created**

Run:
```bash
pnpm exec prisma studio
```
Expected: a `User` row exists with `ssoId = "mock-sso-id"`, `name = "mockuser"`, `role = participant`, `email = null`, `passwordHash = null`. (Or verify via any DB client.)

- [ ] **Step 6: Confirm the button is hidden when disabled**

Temporarily comment out `NEXT_PUBLIC_IAM_ENABLED` in `.env.local`, restart `pnpm dev`, reload `/login` → confirm the IAM button is **absent**. Restore the variable afterward.

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/login/page.tsx" .env.example
git commit -m "feat(auth): add IAM login button and env docs; verify SSO flow via mock mode"
```

---

## Handoff notes (for the intranet deployment, not code)

- Give the SSO project group the callback URL to register per environment: `${AUTH_URL}/api/sso/iam/callback` (one for the intranet prod host, one for the test host).
- On the intranet deployment set real `IAM_BASE_URL` / `IAM_CLIENT_ID` / `IAM_CLIENT_SECRET` / `AUTH_URL` / `NEXT_PUBLIC_IAM_ENABLED=true`, and `IAM_MOCK` unset (or `false`).
- Real IAM verification (network-dependent) happens only on the intranet host.
