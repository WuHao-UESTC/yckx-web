import { z } from "zod";

export const createStickyNoteSchema = z.object({
  content: z.string().trim().min(1).max(200),
  isAnonymous: z.boolean().default(false),
});
