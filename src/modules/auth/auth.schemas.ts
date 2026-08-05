import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/, "用户名只能包含字母、数字、下划线或短横线"),
  password: z.string().min(8).max(200),
  inviteCode: z.string().trim().min(1).max(64),
});
