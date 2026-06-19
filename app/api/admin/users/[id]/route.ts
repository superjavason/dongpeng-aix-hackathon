import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { userUpdateSchema } from "@/lib/schemas";
import { ok, fail, handleError } from "@/lib/api";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);

    const { id } = await params;
    if (id === admin.id) return fail("不能修改自己的角色或状态", 400);

    const parsed = userUpdateSchema.safeParse(await req.json());
    if (!parsed.success) return fail("参数有误", 422);

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, role: true, disabled: true },
    });
    return ok(user);
  } catch (e) {
    return handleError(e);
  }
}
