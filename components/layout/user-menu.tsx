"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, LayoutDashboard, Gavel, Shield } from "lucide-react";
import type { Role } from "@prisma/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROLE_LABELS } from "@/lib/constants";

export function UserMenu({
  name,
  role,
}: {
  name: string;
  role: Role;
}) {
  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign("/");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 transition hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{name}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <div className="flex items-center gap-3 border-b pb-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">
              {name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1 py-2">
          <MenuLink href="/dashboard" icon={<LayoutDashboard />}>
            我的工作台
          </MenuLink>
          {(role === "judge" || role === "admin") && (
            <MenuLink href="/judge" icon={<Gavel />}>
              评委后台
            </MenuLink>
          )}
          {role === "admin" && (
            <MenuLink href="/admin" icon={<Shield />}>
              管理员后台
            </MenuLink>
          )}
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-1" /> 退出登录
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}
