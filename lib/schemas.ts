import { z } from "zod";
import { TRACKS } from "./constants";

/**
 * 已上传文件的 URL：生产为 Vercel Blob 绝对地址（https://…），
 * 本地开发回落为相对路径（/uploads/…）。两者都需通过校验。
 */
const storedUrl = z
  .string()
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\//.test(v),
    "文件链接格式不正确"
  );

export const registerSchema = z.object({
  name: z.string().min(2, "姓名至少 2 个字").max(30),
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(6, "密码至少 6 位").max(64),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码"),
});

export const projectSchema = z.object({
  title: z.string().min(2, "项目名称至少 2 个字").max(60),
  tagline: z.string().min(4, "一句话简介至少 4 个字").max(80),
  description: z.string().min(10, "项目描述至少 10 个字").max(4000),
  track: z.enum(TRACKS as unknown as [string, ...string[]]),
  maxMembers: z.coerce.number().int().min(1).max(5),
  coverImageUrl: storedUrl.optional().or(z.literal("")),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const applySchema = z.object({
  message: z.string().max(300).optional(),
});

export const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

const attachmentSchema = z.object({
  name: z.string(),
  url: storedUrl,
});

export const submissionSchema = z.object({
  title: z.string().min(2, "作品标题至少 2 个字").max(80),
  summary: z.string().min(10, "作品介绍至少 10 个字").max(3000),
  repoUrl: z.string().url("请输入有效链接").optional().or(z.literal("")),
  demoUrl: z.string().url("请输入有效链接").optional().or(z.literal("")),
  videoUrl: z.string().url("请输入有效链接").optional().or(z.literal("")),
  images: z.array(storedUrl).max(8).default([]),
  attachments: z.array(attachmentSchema).max(5).default([]),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;

export const scoreSchema = z.object({
  scores: z.record(z.string(), z.coerce.number().min(0)),
  comment: z.string().max(1000).optional(),
});

export const criterionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  weight: z.coerce.number().min(1),
  max: z.coerce.number().min(1),
  description: z.string().max(300).optional(),
});

export const eventUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(2).optional(),
  phase: z
    .enum(["draft", "registration", "in_progress", "judging", "ended"])
    .optional(),
  scoreCriteria: z.array(criterionSchema).min(1).optional(),
  resultsPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
  track: z.string().max(80).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});

export const eventCreateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(2),
  track: z.string().max(80).optional(),
  phase: z
    .enum(["draft", "registration", "in_progress", "judging", "ended"])
    .default("draft"),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  scoreCriteria: z.array(criterionSchema).min(1).optional(),
});

export const userUpdateSchema = z.object({
  role: z.enum(["participant", "judge", "admin"]).optional(),
  disabled: z.boolean().optional(),
});
