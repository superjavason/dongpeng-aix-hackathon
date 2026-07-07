"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Trophy,
  Gavel,
  Settings,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "看板", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/projects", label: "项目管理", icon: FolderKanban },
  { href: "/admin/submissions", label: "作品管理", icon: Trophy },
  { href: "/admin/judges", label: "评委管理", icon: Gavel },
  { href: "/admin/events", label: "赛事管理", icon: CalendarDays },
  { href: "/admin/event", label: "赛事设置", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b bg-white px-4">
      <div className="container flex gap-1">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition",
                active
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
