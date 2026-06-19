"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { StoredFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/upload/image-uploader";
import { FileUploader } from "@/components/upload/file-uploader";

export type SubmissionInitial = {
  title: string;
  summary: string;
  repoUrl: string;
  demoUrl: string;
  videoUrl: string;
  images: string[];
  attachments: StoredFile[];
};

export function SubmissionForm({
  projectId,
  initial,
}: {
  projectId: string;
  initial: SubmissionInitial;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initial.images);
  const [attachments, setAttachments] = useState<StoredFile[]>(
    initial.attachments
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get("title"),
      summary: form.get("summary"),
      repoUrl: form.get("repoUrl"),
      demoUrl: form.get("demoUrl"),
      videoUrl: form.get("videoUrl"),
      images,
      attachments,
    };
    const res = await fetch(`/api/projects/${projectId}/submission`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "保存失败");
      return;
    }
    toast.success("作品已保存");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">作品标题</Label>
        <Input id="title" name="title" defaultValue={initial.title} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary">作品介绍</Label>
        <Textarea
          id="summary"
          name="summary"
          defaultValue={initial.summary}
          rows={6}
          required
          placeholder="介绍作品功能、亮点、技术方案与成果…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="repoUrl">代码仓库</Label>
          <Input id="repoUrl" name="repoUrl" defaultValue={initial.repoUrl} placeholder="https://" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demoUrl">Demo 链接</Label>
          <Input id="demoUrl" name="demoUrl" defaultValue={initial.demoUrl} placeholder="https://" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="videoUrl">演示视频</Label>
          <Input id="videoUrl" name="videoUrl" defaultValue={initial.videoUrl} placeholder="https://" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>作品截图</Label>
        <ImageUploader value={images} onChange={setImages} max={8} />
      </div>

      <div className="space-y-1.5">
        <Label>附件（PPT / PDF）</Label>
        <FileUploader value={attachments} onChange={setAttachments} max={5} />
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "保存中…" : "保存作品"}
      </Button>
    </form>
  );
}
