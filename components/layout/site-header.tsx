import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/nav-dongpeng-logo-transparent.png"
            alt="东鹏"
            width={113}
            height={28}
            unoptimized
            className="h-7 w-auto shrink-0 object-contain"
          />
          <div className="leading-none">
            <span className="block text-lg font-bold tracking-tight text-foreground">
              AI+X黑客松大赛
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink href="/">首页</NavLink>
          <NavLink href="/projects">项目广场</NavLink>
          <NavLink href="/leaderboard">排行榜</NavLink>
          <NavLink href="/about">关于赛事</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu name={user.name ?? "用户"} role={user.role} />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild>
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
    >
      {children}
    </Link>
  );
}
