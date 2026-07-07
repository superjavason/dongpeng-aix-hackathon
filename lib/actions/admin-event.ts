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
