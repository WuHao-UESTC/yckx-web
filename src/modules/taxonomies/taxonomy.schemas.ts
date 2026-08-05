import { z } from "zod";

export const categoryTypeSchema = z.enum(["KNOWLEDGE", "COMPETITION"]);
export const columnTypeSchema = z.enum(["NEWS", "DAILY"]);

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: categoryTypeSchema,
});

export const createColumnSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(300).optional().default(""),
  type: columnTypeSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
