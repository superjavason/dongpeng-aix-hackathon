"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data.ok) {
      setLoading(false);
      toast.error(data.error ?? "注册失败");
      return;
    }

    // 注册成功后自动登录
    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    toast.success("注册成功，欢迎加入！");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">创建账号</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        加入东鹏 AI+X 黑客松，开启你的创意之旅
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">姓名</Label>
          <Input id="name" name="name" required placeholder="你的姓名" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" type="email" required placeholder="you@dongpeng.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">密码</Label>
          <Input id="password" name="password" type="password" required placeholder="至少 6 位" />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "注册中…" : "注册并登录"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          去登录
        </Link>
      </p>
    </div>
  );
}
