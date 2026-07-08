import { NextResponse, type NextRequest } from "next/server";
import {
  isIamEnabled,
  getIamConfig,
  buildAuthorizeUrl,
  safeInternalPath,
  resolveAppUrl,
} from "@/lib/iam";

export async function GET(req: NextRequest) {
  if (!isIamEnabled()) {
    return NextResponse.redirect(resolveAppUrl("/login", req.url));
  }

  const cfg = getIamConfig();
  const callbackUrl = safeInternalPath(
    req.nextUrl.searchParams.get("callbackUrl"),
    ""
  );

  const target = cfg.mock
    ? `${cfg.redirectUri}?code=mock-code`
    : buildAuthorizeUrl(cfg);

  const res = NextResponse.redirect(target);
  // state 为可选参数，IAM 回传状态不稳定，故不传递；仅用 cookie 携带 callbackUrl
  res.cookies.set("iam_oauth_state", JSON.stringify({ callbackUrl }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
  return res;
}
