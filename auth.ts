import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/schemas";
import { exchangeCodeForProfile, findOrCreateSsoUser } from "@/lib/iam";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.disabled) return null;
        if (!user.passwordHash) return null; // SSO-only 用户无密码，禁止密码登录路径

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
    Credentials({
      id: "iam",
      name: "IAM SSO",
      credentials: {
        code: { label: "code", type: "text" },
      },
      async authorize(credentials) {
        const code = typeof credentials?.code === "string" ? credentials.code : null;
        if (!code) return null;

        const profile = await exchangeCodeForProfile(code);
        if (!profile) return null;

        const user = await findOrCreateSsoUser(profile);
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
});
