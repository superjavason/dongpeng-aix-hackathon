"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TRACKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/upload/image-uploader";

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [track, setTrack] = useState<string>(TRACKS[0]);
  const [cover, setCover] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get("title"),
      tagline: form.get("tagline"),
      description: form.get("description"),
      track,
      maxMembers: form.get("maxMembers"),
      coverImageUrl: cover[0] ?? "",
    };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "提报失败");
      return;
    }
    toast.success("项目提报成功！");
    router.push(`/projects/${data.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">项目名称</Label>
        <Input id="title" name="title" required placeholder="给你的项目起个响亮的名字" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tagline">一句话简介</Label>
        <Input id="tagline" name="tagline" required placeholder="用一句话说清项目的价值" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>赛道</Label>
          <Select value={track} onValueChange={setTrack}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACKS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxMembers">队伍人数上限</Label>
          <Input
            id="maxMembers"
            name="maxMembers"
            type="number"
            min={1}
            max={10}
            defaultValue={4}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">项目详细介绍</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={6}
          placeholder="介绍你的创意、要解决的问题、技术方案与预期成果…"
        />
      </div>

      <div className="space-y-1.5">
        <Label>项目封面（选填）</Label>
        <ImageUploader value={cover} onChange={setCover} max={1} />
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "提交中…" : "提交项目"}
      </Button>
    </form>
  );
}
