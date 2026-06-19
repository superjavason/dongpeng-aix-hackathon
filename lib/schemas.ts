import { z } from "zod";
import { TRACKS } from "./constants";

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
  description: z.string().min(10, "项目描述至少 10 个字").max(2000),
  track: z.enum(TRACKS as unknown as [string, ...string[]]),
  maxMembers: z.coerce.number().int().min(1).max(10),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
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
  url: z.string().url(),
});

export const submissionSchema = z.object({
  title: z.string().min(2, "作品标题至少 2 个字").max(80),
  summary: z.string().min(10, "作品介绍至少 10 个字").max(3000),
  repoUrl: z.string().url("请输入有效链接").optional().or(z.literal("")),
  demoUrl: z.string().url("请输入有效链接").optional().or(z.literal("")),
  videoUrl: z.string().url("请输入有效链接").optional().or(z.literal("")),
  images: z.array(z.string().url()).max(8).default([]),
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
});

export const eventUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(2).optional(),
  phase: z
    .enum(["draft", "registration", "in_progress", "judging", "ended"])
    .optional(),
  scoreCriteria: z.array(criterionSchema).min(1).optional(),
  resultsPublished: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
  role: z.enum(["participant", "judge", "admin"]).optional(),
  disabled: z.boolean().optional(),
});
