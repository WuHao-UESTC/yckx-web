import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value == null || (typeof value === "string" && value.trim() === "") ? null : value),
    z.string().trim().max(max).nullable()
  );

const optionalGrade = z.preprocess((value) => {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  if (typeof value === "string") return Number(value);
  return value;
}, z.number().int().min(2010).max(3000).nullable());

const optionalEmail = z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? null : value),
  z.string().trim().email("邮箱格式无效").max(320).nullable()
);

export const profileFormSchema = z.object({
  displayName: optionalText(80),
  bio: optionalText(1_000),
  website: optionalText(2_048),
  github: optionalText(100),
  bilibili: optionalText(100),
  title: optionalText(100),
  grade: optionalGrade,
  contactEmail: optionalEmail,
  qq: optionalText(100),
  wechat: optionalText(100),
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
