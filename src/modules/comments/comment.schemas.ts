import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.string().trim().min(1).max(191),
  content: z.string().trim().min(1).max(5000),
  parentId: z.string().trim().min(1).max(191).nullable().optional(),
});

export const deleteCommentSchema = z.object({ id: z.string().trim().min(1).max(191) });
