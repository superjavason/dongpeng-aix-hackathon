import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
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
    const res = NextResponse.redirect(new URL("/login?error=sso_state", req.url));
    res.cookies.delete("iam_oauth_state");
    return res;
  }
  if (!code) {
    const res = NextResponse.redirect(new URL("/login?error=sso_code", req.url));
    res.cookies.delete("iam_oauth_state");
    return res;
  }

  const redirectTo = safeInternalPath(stored.callbackUrl || null, "/dashboard");

  try {
    (await cookies()).delete("iam_oauth_state");
    // signIn 执行 iam authorize，成功后设置会话 cookie 并抛出 NEXT_REDIRECT 完成跳转
    return await signIn("iam", { code, redirectTo });
  } catch (e) {
    if (isNextRedirect(e)) throw e; // 让 Next 处理成功后的重定向
    return NextResponse.redirect(new URL("/login?error=sso_failed", req.url));
  }
}
