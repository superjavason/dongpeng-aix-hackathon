"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import type { StoredFile } from "@/lib/storage";

async function uploadOne(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", "file");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "上传失败");
  return data.data as StoredFile;
}

export function FileUploader({
  value,
  onChange,
  max = 5,
}: {
  value: StoredFile[];
  onChange: (files: StoredFile[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const picked = Array.from(files).slice(0, max - value.length);
    setUploading(true);
    try {
      const uploaded = await Promise.all(picked.map(uploadOne));
      onChange([...value, ...uploaded]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value.map((f) => (
        <div
          key={f.url}
          className="flex items-center justify-between rounded-md border bg-neutral-50 px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2 truncate">
            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="truncate hover:underline"
            >
              {f.name}
            </a>
          </span>
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x.url !== f.url))}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed py-2.5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          上传附件（PDF / PPT，≤10MB）
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.ppt,.pptx,image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
