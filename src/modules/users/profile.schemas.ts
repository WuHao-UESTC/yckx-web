import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable()
  );

const optionalLink = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .max(2048)
    .refine((value) => value.startsWith("/") || URL.canParse(value), "链接格式无效")
    .nullable()
);

export const profileFormSchema = z.object({
  displayName: optionalText(80),
  bio: optionalText(1_000),
  website: optionalLink,
  github: optionalText(100),
  bilibili: optionalText(100),
  title: optionalText(100),
});

export const changePasswordFormSchema = z
  .object({
    oldPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的新密码不一致",
  });
