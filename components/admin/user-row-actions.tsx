"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Role } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function UserRowActions({
  userId,
  role,
  disabled,
  isSelf,
}: {
  userId: string;
  role: Role;
  disabled: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "操作失败");
      return;
    }
    toast.success("已更新");
    router.refresh();
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">当前账号</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        defaultValue={role}
        onValueChange={(v) => patch({ role: v })}
      >
        <SelectTrigger className="h-9 w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="participant">参赛者</SelectItem>
          <SelectItem value="judge">评委</SelectItem>
          <SelectItem value="admin">管理员</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant={disabled ? "default" : "outline"}
        disabled={loading}
        onClick={() => patch({ disabled: !disabled })}
      >
        {disabled ? "启用" : "禁用"}
      </Button>
    </div>
  );
}
