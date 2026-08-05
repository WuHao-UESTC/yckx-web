import { z } from "zod";

export const categoryTypeSchema = z.enum(["KNOWLEDGE", "COMPETITION"]);
export const columnTypeSchema = z.enum(["NEWS", "DAILY", "TECHNICAL"]);

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: categoryTypeSchema,
});

const columnFields = {
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(300).optional().default(""),
};

export const createColumnSchema = z.discriminatedUnion("type", [
  z.object({ ...columnFields, type: z.literal("NEWS"), categoryId: z.undefined().optional() }),
  z.object({ ...columnFields, type: z.literal("DAILY"), categoryId: z.undefined().optional() }),
  z.object({
    ...columnFields,
    type: z.literal("TECHNICAL"),
    categoryId: z.string().trim().min(1).max(191),
  }),
]);

export const renameCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const renameColumnSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

const taxonomySlugSchema = z.string().trim().min(1).max(191);
export const renameCategoryFormSchema = renameCategorySchema.extend({ slug: taxonomySlugSchema });
export const renameColumnFormSchema = renameColumnSchema.extend({ slug: taxonomySlugSchema });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;
export type RenameColumnInput = z.infer<typeof renameColumnSchema>;
