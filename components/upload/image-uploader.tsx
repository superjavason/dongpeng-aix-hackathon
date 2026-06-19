"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

async function uploadOne(file: File, kind: "image" | "file") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "上传失败");
  return data.data as { url: string; name: string };
}

export function ImageUploader({
  value,
  onChange,
  max = 8,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    const picked = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded = await Promise.all(picked.map((f) => uploadOne(f, "image")));
      onChange([...value, ...uploaded.map((u) => u.url)]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {value.map((url) => (
        <div
          key={url}
          className="group relative h-24 w-24 overflow-hidden rounded-lg border"
        >
          <Image src={url} alt="" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(value.filter((u) => u !== url))}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition hover:border-primary hover:text-primary",
            uploading && "opacity-60"
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span className="text-xs">上传图片</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
