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

export const registrationStartSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    username: z
      .string()
      .trim()
      .min(3)
      .max(20)
      .regex(/^[a-zA-Z0-9_-]+$/, "用户名只能包含字母、数字、下划线或短横线"),
    displayName: z.string().trim().max(40).optional(),
    password: z.string().min(8).max(200),
    accountType: z.enum(["MEMBER", "GUEST"]),
    inviteCode: z.string().trim().max(64).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.accountType === "MEMBER" && !value.inviteCode) {
      ctx.addIssue({ code: "custom", path: ["inviteCode"], message: "科协人员注册需要邀请码" });
    }
    if (value.accountType === "GUEST" && value.inviteCode) {
      ctx.addIssue({ code: "custom", path: ["inviteCode"], message: "游客注册不需要邀请码" });
    }
  });

export const verificationConfirmSchema = z.object({
  challengeId: z.string().trim().min(1).max(191),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "验证码应为 6 位数字"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const passwordResetSchema = verificationConfirmSchema.extend({
  password: z.string().min(8).max(200),
});
