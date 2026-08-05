import { z } from "zod";

export const subscriptionTargetSchema = z.object({
  targetType: z.enum(["SITE", "CATEGORY", "COLUMN"]),
  targetId: z.string().trim().max(191).optional(),
  siteKey: z.enum(["ALL", "KNOWLEDGE", "COMPETITION", "NEWS"]).optional(),
});

export type SubscriptionTarget = z.infer<typeof subscriptionTargetSchema>;
