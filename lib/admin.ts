import { getSessionUser } from "@/lib/session";

/** API 上下文中校验管理员；非管理员返回 null。 */
export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}
