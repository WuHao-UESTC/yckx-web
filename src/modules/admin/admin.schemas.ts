import { z } from "zod";
import { postStatusSchema } from "../posts/posts.schemas";

export const resourceIdSchema = z.string().trim().min(1).max(191);

export const createCategoryFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["KNOWLEDGE", "COMPETITION", "NEWS", "EVENT", "COLUMN", "ROUTINE"]),
});

export const toggleTaxonomyFormSchema = z.object({
  id: resourceIdSchema,
  resource: z.enum(["category", "column"]),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const milestoneDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "请输入有效日期")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const milestoneFormSchema = z.object({
  occurredAt: milestoneDateSchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
});

export const updateMilestoneFormSchema = milestoneFormSchema.extend({
  id: resourceIdSchema,
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
