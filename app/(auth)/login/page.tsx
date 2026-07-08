"use client";

import { Suspense, useEffect, useState } from "react";
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

  useEffect(() => {
    getSession().then((session) => {
      const role = session?.user?.role;
      if (!role) return;
      const defaultUrl =
        role === "admin" ? "/admin" : role === "judge" ? "/judge" : "/dashboard";
      const targetUrl = callbackUrl?.startsWith("/") ? callbackUrl : defaultUrl;
      router.replace(targetUrl);
    });
  }, [callbackUrl, router]);

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

      {process.env.NEXT_PUBLIC_IAM_ENABLED === "true" && (
        <div className="mt-6">
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t" />
            <span className="mx-3 text-xs text-muted-foreground">或</span>
            <div className="flex-grow border-t" />
          </div>
          <a
            href={`/api/sso/iam/start${
              callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
            }`}
            className="block"
          >
            <Button type="button" variant="outline" className="mt-3 w-full" size="lg">
              东鹏企业登录（IAM）
            </Button>
          </a>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          立即注册
        </Link>
      </p>
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
