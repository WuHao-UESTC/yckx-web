import { z } from "zod";

export const graphPostsQuerySchema = z.object({
  slug: z.string().trim().min(1).max(120),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(5).default(5),
});

export const competitionRadarQuerySchema = z.object({
  slug: z.string().trim().min(1).max(120).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(7).default(7),
});
