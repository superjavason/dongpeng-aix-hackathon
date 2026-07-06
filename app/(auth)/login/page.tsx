"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("邮箱或密码错误");
      return;
    }
    toast.success("登录成功");
    const session = await getSession();
    const role = session?.user?.role;
    const defaultUrl =
      role === "admin" ? "/admin" : role === "judge" ? "/judge" : "/dashboard";
    const targetUrl = callbackUrl?.startsWith("/") ? callbackUrl : defaultUrl;
    router.push(targetUrl);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">欢迎回来</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        登录以提报项目、组队与提交作品
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" type="email" required placeholder="you@dongpeng.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">密码</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          立即注册
        </Link>
      </p>

      <div className="mt-8 rounded-lg border bg-neutral-50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">演示账号（密码 password123）</p>
        <p className="mt-1">管理员 admin@dongpeng.com · 评委 judge1@dongpeng.com · 参赛者 user1@dongpeng.com</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
