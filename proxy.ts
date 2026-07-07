import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;
  const role = user?.role;
  const path = nextUrl.pathname;

  const needLogin =
    path.startsWith("/dashboard") ||
    path.startsWith("/judge") ||
    path.startsWith("/admin");

  if (needLogin && !user) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (path.startsWith("/judge") && role !== "judge" && role !== "admin") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/judge/:path*", "/admin/:path*"],
};
