import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function ConsoleHeader({
  title,
  accent = "评委后台",
}: {
  title: string;
  accent?: string;
}) {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/nav-dongpeng-logo-transparent.png"
              alt="东鹏"
              width={113}
              height={28}
              unoptimized
              className="h-7 w-auto shrink-0 object-contain"
            />
            <span className="block text-lg font-bold tracking-tight text-foreground">
              {title}
            </span>
          </Link>
          <Badge variant="secondary">{accent}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4" /> 返回首页
            </Link>
          </Button>
          {user && <UserMenu name={user.name ?? "用户"} role={user.role} />}
        </div>
      </div>
    </header>
  );
}
