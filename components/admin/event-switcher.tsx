"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setAdminEvent } from "@/lib/actions/admin-event";

type SwitcherEvent = { id: string; name: string; isActive: boolean };

export function EventSwitcher({
  events,
  currentId,
}: {
  events: SwitcherEvent[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (events.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        暂无赛事，请前往「赛事管理」新建。
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">当前管理</span>
      <Select
        value={currentId ?? undefined}
        disabled={pending}
        onValueChange={(id) =>
          startTransition(async () => {
            await setAdminEvent(id);
            router.refresh();
          })
        }
      >
        <SelectTrigger className="h-8 w-[220px] bg-white">
          <SelectValue placeholder="选择赛事" />
        </SelectTrigger>
        <SelectContent>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
              {e.isActive ? "（活跃）" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
