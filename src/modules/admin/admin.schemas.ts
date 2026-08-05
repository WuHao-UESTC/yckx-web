import { z } from "zod";
import { postStatusSchema } from "@/modules/posts/posts.schemas";

export const resourceIdSchema = z.string().trim().min(1).max(191);

export const createCategoryFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["KNOWLEDGE", "COMPETITION", "EVENT", "COLUMN", "ROUTINE"]),
});

export const invitationFormSchema = z.object({
  maxUses: z.coerce.number().int().min(1).max(100),
  days: z.coerce.number().int().min(1).max(365),
});

export const movePhotoFormSchema = z.object({
  id: resourceIdSchema,
  direction: z.enum(["up", "down"]),
});

export const changePostStatusFormSchema = z.object({
  id: resourceIdSchema,
  status: postStatusSchema,
});

export const siteConfigValueSchema = z.string().max(10_000);
