import { getSessionUser } from "@/lib/session";
import {
  saveFile,
  MAX_ATTACHMENT_FILE_SIZE,
  MAX_IMAGE_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/storage";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("请先登录", 401);

    const formData = await req.formData();
    const file = formData.get("file");
    const kind = formData.get("kind"); // "image" | "file"

    if (!(file instanceof File)) return fail("未找到上传文件", 400);
    const maxSize = kind === "image" ? MAX_IMAGE_FILE_SIZE : MAX_ATTACHMENT_FILE_SIZE;
    if (file.size > maxSize) {
      return fail(kind === "image" ? "图片不能超过 10MB" : "附件不能超过 500MB", 413);
    }

    const allowed = kind === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowed.includes(file.type)) {
      return fail("不支持的文件类型", 415);
    }

    const stored = await saveFile(file);
    return ok(stored);
  } catch (e) {
    return handleError(e);
  }
}
