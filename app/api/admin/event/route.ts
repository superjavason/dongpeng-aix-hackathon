import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { eventCreateSchema } from "@/lib/schemas";
import { DEFAULT_CRITERIA } from "@/lib/constants";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return fail("无权限", 403);

    const parsed = eventCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "参数有误", 422);
    }
    const { scoreCriteria, ...rest } = parsed.data;

    const event = await prisma.event.create({
      data: {
        ...rest,
        scoreCriteria: (scoreCriteria ?? DEFAULT_CRITERIA) as object,
        isActive: false,
      },
    });
    return ok({ id: event.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
