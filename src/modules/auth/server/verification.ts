import "server-only";

import { createHash, randomInt, randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/server/email/mailer";
import { BadRequestError } from "@/server/http/errors";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(challengeId: string, code: string): string {
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? "local-secret"}:${challengeId}:${code}`)
    .digest("hex");
}

function createCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function createVerificationChallenge(input: {
  purpose: "REGISTER" | "RESET_PASSWORD";
  email: string;
  username?: string;
  displayName?: string;
  passwordHash?: string;
  role?: "MEMBER" | "GUEST";
  inviteCode?: string;
  userId?: string;
  requestIp?: string;
}) {
  const recentCount = await prisma.verificationChallenge.count({
    where: {
      email: input.email,
      purpose: input.purpose,
      createdAt: { gte: new Date(Date.now() - RESEND_WINDOW_MS) },
    },
  });
  if (recentCount > 0) throw new BadRequestError("请稍后再获取验证码");

  const challengeId = randomUUID();
  const code = createCode();
  const challenge = await prisma.verificationChallenge.create({
    data: {
      id: challengeId,
      purpose: input.purpose,
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      role: input.role,
      inviteCode: input.inviteCode,
      userId: input.userId,
      codeHash: hashCode(challengeId, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      requestIp: input.requestIp,
    },
    select: { id: true, email: true, purpose: true },
  });

  const purposeText = input.purpose === "REGISTER" ? "注册" : "重置密码";
  try {
    await sendEmail({
      to: input.email,
      subject: `英才科协信息库${purposeText}验证码`,
      html: `<p>你的${purposeText}验证码是：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>验证码 10 分钟内有效，仅可使用一次。如果不是你本人操作，请忽略此邮件。</p>`,
    });
  } catch (error) {
    await prisma.verificationChallenge.delete({ where: { id: challenge.id } });
    throw error;
  }

  return challenge.id;
}

export async function consumeVerificationChallenge(
  challengeId: string,
  code: string,
  purpose: "REGISTER" | "RESET_PASSWORD"
) {
  return prisma.$transaction(
    async (tx) => {
      const challenge = await tx.verificationChallenge.findUnique({ where: { id: challengeId } });
      if (!challenge || challenge.purpose !== purpose || challenge.status !== "PENDING") {
        throw new BadRequestError("验证码无效或已使用");
      }
      if (challenge.expiresAt < new Date()) {
        await tx.verificationChallenge.update({
          where: { id: challenge.id },
          data: { status: "EXPIRED" },
        });
        throw new BadRequestError("验证码已过期");
      }
      if (challenge.attempts >= MAX_ATTEMPTS) throw new BadRequestError("验证码尝试次数过多");

      const valid = hashCode(challenge.id, code) === challenge.codeHash;
      if (!valid) {
        await tx.verificationChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        throw new BadRequestError("验证码错误");
      }

      await tx.verificationChallenge.update({
        where: { id: challenge.id },
        data: { status: "CONSUMED", consumedAt: new Date() },
      });
      return challenge;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
