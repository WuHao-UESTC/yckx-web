import { hash } from "bcrypt";
import { prisma } from "./prisma";

/** 生成邀请码（16位随机字符串） */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** 验证邀请码 */
export async function verifyInviteCode(code: string) {
  const invitation = await prisma.invitation.findUnique({ where: { code } });
  if (!invitation) return { valid: false, reason: "邀请码不存在" as const };
  if (!invitation.isActive) return { valid: false, reason: "邀请码已禁用" as const };
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    return { valid: false, reason: "邀请码已过期" as const };
  }
  if (invitation.usedCount >= invitation.maxUses) {
    return { valid: false, reason: "邀请码已用完" as const };
  }
  return { valid: true, invitation };
}

/** 哈希密码 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/** 从 Markdown 生成摘要 */
export function generateExcerpt(markdown: string, maxLength = 200): string {
  const plainText = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[\[*>`_~]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return plainText.length > maxLength
    ? plainText.slice(0, maxLength) + "..."
    : plainText;
}

/** 生成 URL 友好的 slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
