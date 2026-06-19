import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/schemas";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "输入有误", 422);
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail("该邮箱已被注册", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "participant" },
      select: { id: true, name: true, email: true, role: true },
    });

    return ok(user, 201);
  } catch (e) {
    return handleError(e);
  }
}
