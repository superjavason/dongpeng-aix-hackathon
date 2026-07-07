"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EventCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/admin/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        track: track || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "创建失败");
      return;
    }
    toast.success("赛事已创建");
    setOpen(false);
    setName("");
    setDescription("");
    setTrack("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> 新建赛事
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建赛事</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-name">赛事名称</Label>
            <Input
              id="ev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：2026 第二届 AI+X 黑客松"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">简介</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="赛事背景与说明"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-track">赛道（可选）</Label>
            <Input
              id="ev-track"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="例如：AI 应用 / AI 工具"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            onClick={submit}
            disabled={loading || name.length < 2 || description.trim().length < 2}
          >
            {loading ? "创建中…" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SetActiveButton({
  eventId,
  isActive,
}: {
  eventId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isActive) {
    return (
      <Button size="sm" variant="outline" disabled>
        当前活跃
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch(`/api/admin/event/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
        const data = await res.json();
        setLoading(false);
        if (!data.ok) {
          toast.error(data.error ?? "操作失败");
          return;
        }
        toast.success("已设为活跃赛事");
        router.refresh();
      }}
    >
      {loading ? "设置中…" : "设为活跃"}
    </Button>
  );
}
