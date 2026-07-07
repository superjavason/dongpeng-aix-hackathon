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
