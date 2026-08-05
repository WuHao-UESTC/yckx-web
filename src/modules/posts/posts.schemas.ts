import { z } from "zod";

const nullableReferenceSchema = z.union([z.string().trim().min(1).max(191), z.null()]).optional();

const nullablePathSchema = z.union([z.string().trim().max(2048), z.null()]).optional();

const tagNameSchema = z.string().trim().min(1).max(40);
const attachmentIdsSchema = z.array(z.string().trim().min(1).max(191)).max(20);
const technicalColumnIdsSchema = z.array(z.string().trim().min(1).max(191)).max(20);
const newsColumnIdsSchema = z.array(z.string().trim().min(1).max(191)).max(20);

export const postStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const postKindSchema = z.enum(["TECHNICAL", "NEWS", "DAILY"]);
export const markdownStyleSchema = z.enum(["DEFAULT", "TECHNICAL", "PAPER"]);

export const postListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  categoryId: z.string().trim().min(1).max(191).optional(),
  tag: z.string().trim().min(1).max(191).optional(),
  status: z.union([postStatusSchema, z.literal("all")]).default("PUBLISHED"),
  kind: postKindSchema.optional(),
  columnId: z.string().trim().min(1).max(191).optional(),
  authorId: z.string().trim().min(1).max(191).optional(),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(2_000_000),
  categoryId: nullableReferenceSchema,
  tags: z.array(tagNameSchema).max(20).default([]),
  coverImage: nullablePathSchema,
  columnId: nullableReferenceSchema,
  kind: postKindSchema.default("TECHNICAL"),
  attachmentIds: attachmentIdsSchema.default([]),
  technicalColumnIds: technicalColumnIdsSchema.default([]),
  newsColumnIds: newsColumnIdsSchema.default([]),
  renderStyle: markdownStyleSchema.default("DEFAULT"),
});

export const updatePostSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(2_000_000).optional(),
    categoryId: nullableReferenceSchema,
    tags: z.array(tagNameSchema).max(20).optional(),
    coverImage: nullablePathSchema,
    columnId: nullableReferenceSchema,
    kind: postKindSchema.optional(),
    attachmentIds: attachmentIdsSchema.optional(),
    technicalColumnIds: technicalColumnIdsSchema.optional(),
    newsColumnIds: newsColumnIdsSchema.optional(),
    renderStyle: markdownStyleSchema.optional(),
    status: postStatusSchema.optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "至少提供一个需要更新的字段",
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
