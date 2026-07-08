# IAM OAuth2.0（CAS）企业登录集成 — 设计文档

- 日期：2026-07-07
- 状态：已确认，待实现
- 相关：`auth.ts` / `auth.config.ts`、`prisma/schema.prisma`、`app/(auth)/login/page.tsx`、`app/api/register/route.ts`

## 1. 背景与目标

为黑客松平台**新增东鹏公司 IAM 的 OAuth2.0（CAS，`esc-sso`）单点登录**，作为内部员工的注册与登录方式，与现有邮箱密码方式**并存**。

现状关键约束：

- `User` 表以 `email` 唯一键、`passwordHash` 必填、`name` 必填；session 采用 **JWT 策略**（Credentials 登录必须用 JWT）；`@auth/prisma-adapter` 已安装但未接入。
- 现有登录/注册走邮箱密码：`signIn("credentials")` 与 `POST /api/register`。

IAM 侧关键事实（据对接文档《OAuth2.0 认证 Code 模式接口》）：

- 授权码模式；端点在 `${IAM}/esc-sso/oauth2.0/{authorize,accessToken,profile}`。
- **`profile` 只返回 `id`（主账号）与 `attributes.account_no`（从账号），不返回 email、不返回姓名。**
- `accessToken` 是老式 CAS 实现，返回体常为 `access_token=xxx` 的 **form 格式而非标准 JSON**；无 PKCE；`state` 为透传。
- 测试环境 `iamtest.dongpeng.net`、生产环境 `iam.dongpeng.net`，**均仅内网可达**。

凭据（由 SSO 项目组提供）：

| 环境 | clientID | clientSecret | IAM 地址 |
|---|---|---|---|
| 测试 | `74c5ecf39649fc45fce8` | `dcab1e928defe4426068f0fc40295133c412` | `https://iamtest.dongpeng.net` |
| 生产 | `8f182297edf39c401388` | `c351b8ba265d30434d2850c75409e35170de` | `https://iam.dongpeng.net` |

## 2. 已确认的产品/架构决策

1. **面向对象**：仅内部员工走 IAM SSO；外部参赛者继续邮箱密码。两套并存。SSO 用户默认角色 `participant`，管理员手动提权。
2. **账号映射**：新增 `ssoId` 唯一列作为 SSO 关联键；`email`、`passwordHash` 改为可空；SSO 用户首次登录 email 留空，后续可在系统内补全。显示名默认取 `account_no`（回退 `id`），用户可后续修改。
3. **部署拓扑**：IAM 仅内网 → **生产在内网/公司云重新部署**；**Vercel 仅作开发演示环境**，SSO 在 Vercel 上不可用（连不通 IAM）属预期，邮箱密码在 Vercel 保持可用。因此 IAM 集成必须**由环境变量驱动、可开关**，未配置时自动隐藏入口。
4. **接法**：方案 B —— 自建路由手工跑 OAuth 授权码流程 + 隐藏的 `iam` Credentials provider 桥接签发 JWT session。理由：面对老式 CAS + 只能内网验证，可控性/可调试性优先于少写代码，避免与 NextAuth 严格 OAuth 客户端对抗协议细节。

## 3. 数据模型变更（Prisma）

```prisma
model User {
  email        String?  @unique   // 由 必填 → 可空
  passwordHash String?             // 由 必填 → 可空
  ssoId        String?  @unique    // 新增：IAM profile 的 id（主账号）
  // 其余字段不变
}
```

- Postgres 的 UNIQUE 列允许多个 NULL，故大量 SSO 用户 `email=null`、大量密码用户 `ssoId=null` 均合法。
- 迁移无损：现有用户 email 照旧，仅放宽约束 + 加列。本地 `prisma migrate dev`；内网部署 `prisma migrate deploy`。

**配套 guard（防回归）：**

- `auth.ts` 的 Credentials `authorize`：在 `bcrypt.compare` 之前加 `if (!user.passwordHash) return null;`，避免 SSO-only 用户（`passwordHash=null`）被密码登录路径命中或触发异常。
- `POST /api/register`：uniqueness 仍按 email 唯一，无需改逻辑。
- 展示 `user.email` 处（如 admin 用户列表）做 null 兜底展示。

## 4. 配置与开关（环境变量驱动）

```
IAM_BASE_URL=https://iam.dongpeng.net/esc-sso      # test 环境：https://iamtest.dongpeng.net/esc-sso
IAM_CLIENT_ID=8f182297edf39c401388                 # test：74c5ecf39649fc45fce8
IAM_CLIENT_SECRET=c351b8ba265d30434d2850c75409e35170de   # test：dcab1e928defe4426068f0fc40295133c412
AUTH_URL=https://<内网部署域名>                     # 拼 redirect_uri，同时修复既有 signout 跳 localhost 问题
NEXT_PUBLIC_IAM_ENABLED=true                        # 控制登录页是否渲染 IAM 按钮
IAM_MOCK=false                                      # 见第 8 节，本地无网络端到端联调用
```

- **`IAM_CLIENT_ID` 缺失 → provider 关闭**；`NEXT_PUBLIC_IAM_ENABLED` 未设 → 登录页不渲染 IAM 按钮。**Vercel 演示环境不设这些变量即可**，自动只保留邮箱密码。
- 端点路径为 `esc-sso`（文档换行处误显为 `escsso`，以带下划线的链接为准）：`/oauth2.0/authorize`、`/oauth2.0/accessToken`、`/oauth2.0/profile`。
- **需交 SSO 项目组注册的回调地址** = `${AUTH_URL}/api/sso/iam/callback`（test 与内网 prod 各注册一个）。

## 5. OAuth 流程：两个自建路由

### `GET /api/sso/iam/start`（可带 `?callbackUrl=`）

1. IAM 关闭（`IAM_CLIENT_ID` 缺失）→ 302 回 `/login`。
2. 生成随机 `state`（`crypto.randomUUID()` 或 randomBytes）。
3. 将 `state` 与期望登录后跳转（校验为站内相对路径）写入 httpOnly + secure + SameSite=Lax 的短时 cookie（`iam_oauth_state`，如 5 分钟）。
4. 拼 `${IAM_BASE_URL}/oauth2.0/authorize?client_id=…&response_type=code&redirect_uri=<enc(${AUTH_URL}/api/sso/iam/callback)>&state=<state>`。
5. 302 跳 IAM。

### `GET /api/sso/iam/callback?code=&state=`

1. 校验 query 的 `state` 与 cookie 一致（防登录 CSRF）；随即清除 cookie。不一致 → `/login?error=sso_state`。
2. 缺 `code` → `/login?error=sso_code`。
3. 用第 6 节的 `iam` Credentials provider，以 `code`（及站内跳转目标）换取会话；token 交换 / profile 拉取 / 建号均在 provider 的 `authorize` 内完成。
4. 成功 → 重定向到 cookie 中记录的站内目标（默认按角色：admin→`/admin`、judge→`/judge`、其余→`/dashboard`）。失败 → `/login?error=sso_failed`。

## 6. 会话签发 + JIT 建号（`iam` Credentials provider）

在 `auth.ts` 增加一个**隐藏的** `Credentials` provider（id=`iam`），`authorize({ code })` 内：

1. **换 token**：POST `${IAM_BASE_URL}/oauth2.0/accessToken`，参数 `grant_type=authorization_code`、`client_id`、`client_secret`、`code`、`redirect_uri`。**返回体兼容解析**：先 `new URLSearchParams(text).get("access_token")`（CAS form 格式），失败回退 `JSON.parse`。取不到 token → 返回 null。
2. **取用户信息**：GET `${IAM_BASE_URL}/oauth2.0/profile?access_token=<token>` → 解析 `id`（主账号）与 `attributes.account_no`。
3. **JIT 建号**：`prisma.user.upsert({ where: { ssoId: id }, create: { ssoId: id, name: account_no ?? id, role: "participant", email: null, passwordHash: null }, update: {} })`。若 `user.disabled` → 返回 null（拒登）。
4. 返回 `{ id: user.id, name: user.name, email: user.email ?? undefined, role: user.role, image: user.avatarUrl ?? undefined }`，交由现有 `jwt`/`session` 回调注入 `id`/`role`。

**安全性**：`code` 是 IAM 签发的一次性、不可伪造凭证，token 交换失败即拒登。因此即便 `/api/auth/callback/iam` 理论上可被外部 POST，攻击者也拿不到合法 `code`，无法伪造身份。这是选择"code 即证明"放进 `authorize` 的原因——避免了裸传 `ssoId` 被冒用的漏洞。登录 CSRF 由第 5 节的 `state` cookie 校验兜住。

> **实现注意**：需验证 v5 中在 Route Handler 内以 Credentials `signIn("iam", { code, redirectTo })` 触发 authorize 并正确 Set-Cookie + 重定向的具体接线（cookie 随重定向响应下发）。这是实现期需实际跑通并验证的点。

## 7. UI 变更

- **登录页 `app/(auth)/login/page.tsx`**：当 `NEXT_PUBLIC_IAM_ENABLED` 为真，在邮箱表单下方增加「东鹏企业登录」按钮，本质为 `<a href="/api/sso/iam/start?callbackUrl=<当前 callbackUrl>">`。未启用则不渲染。
- **注册页不变**：内部员工不自助注册，点 IAM 按钮即 JIT 建号。

## 8. 明确不做（YAGNI）

- IAM 单点登出（`${IAM}/esc-sso/cxf/api/v1/ssoSession/remove`）。
- `checkAccessToken` 周期有效性校验。
- `refresh_token` 续期。

登录后由本地 JWT session 的 `maxAge` 管理会话。登出维持现状（清本地 session + 跳 `/`）。以上均记为未来可选项。

## 9. 验证策略（针对"只能内网测"）

1. **纯函数单测**（任何环境可跑，Vitest）：
   - token 返回解析器（form 与 JSON 两种输入）。
   - profile → 本地用户字段的映射。
   - `state` 生成/校验、站内跳转白名单校验。
   - JIT upsert（mock prisma / 测试库）：首次建号、二次复用、`disabled` 拒登。
2. **本地 Mock IAM 模式**：`IAM_MOCK=true` 时，`iam` provider 的 token/profile 步骤短路为一个固定假 profile，使 `start → callback → 建号 → 登录` 整条链路在**无网络**下端到端可验证接线正确。
3. **真机验证**（内网部署）：将 `${AUTH_URL}/api/sso/iam/callback` 交 SSO 组注册 → 配置 env → 点按钮确认登录成功、JIT 建号正确、角色注入正确。

## 10. 交付清单（供实现计划展开）

- Prisma：schema 改动 + 迁移。
- `auth.ts`：新增 `iam` Credentials provider（含 token 解析、profile 映射、JIT upsert）；Credentials `authorize` 加 `passwordHash` 空值 guard。
- 新增 `lib/iam.ts`（纯函数：端点拼装、token 解析、profile 映射、mock 支持）。
- 路由 `app/api/sso/iam/start/route.ts`、`app/api/sso/iam/callback/route.ts`。
- 登录页 IAM 按钮（条件渲染）。
- email null 兜底的展示处。
- `.env.example` 补充 IAM 相关变量与说明。
- 单测 + mock 模式。
- 交接说明：给 SSO 组的回调地址（test / 内网 prod）。
