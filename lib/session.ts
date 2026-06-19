import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** 返回当前登录会话用户（轻量，来自 JWT）；未登录返回 null。 */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** 返回当前登录用户的完整数据库记录；未登录返回 null。 */
export async function getCurrentUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) return null;
  return prisma.user.findUnique({ where: { id: sessionUser.id } });
}

/** 在 Server Component 中要求登录，否则重定向到登录页。 */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** 在 Server Component 中要求指定角色，否则重定向。admin 可访问任意角色页面。 */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role && user.role !== "admin") redirect("/");
  return user;
}
