import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENT_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export type StoredFile = { url: string; name: string };

/**
 * 保存上传文件并返回可访问 URL。
 * 生产：写入 Vercel Blob（需 BLOB_READ_WRITE_TOKEN）。
 * 本地开发（无 token）：回落写入 public/uploads。
 */
export async function saveFile(file: File): Promise<StoredFile> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const key = `${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`hackathon/${key}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, name: file.name };
  }

  // 本地回落
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, key), buffer);
  return { url: `/uploads/${key}`, name: file.name };
}
