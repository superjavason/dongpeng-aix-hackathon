import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);
    const { id } = await params;
    await prisma.submission.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
