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
