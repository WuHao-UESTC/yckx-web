import { z } from "zod";

export const createPhotoSchema = z.object({
  imagePath: z.string().trim().min(1).max(2048),
  caption: z.string().trim().max(2000).optional().nullable(),
});

export const createUploadedPhotoSchema = z.object({
  fileId: z.string().trim().min(1).max(191),
  caption: z.string().trim().max(2000).optional().nullable(),
});

export const updatePhotoSchema = z
  .object({
    caption: z.string().trim().max(2000).optional().nullable(),
    isVisible: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "至少提供一个需要更新的字段",
  });
