import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationStartSchema } from "@/modules/auth/auth.schemas";
import { hashPassword } from "@/modules/auth/server/password";
import { createVerificationChallenge } from "@/modules/auth/server/verification";
import { BadRequestError, ConflictError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(request, registrationStartSchema);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
      select: { email: true },
    });
    if (existing) {
      throw new ConflictError(existing.email === input.email ? "邮箱已被注册" : "用户名已被占用");
    }

    if (input.accountType === "MEMBER") {
      const invitation = await prisma.invitation.findUnique({ where: { code: input.inviteCode } });
      if (
        !invitation ||
        !invitation.isActive ||
        (invitation.expiresAt && invitation.expiresAt < new Date()) ||
        invitation.usedCount >= invitation.maxUses
      ) {
        throw new BadRequestError("邀请码无效或已用完");
      }
    }

    const challengeId = await createVerificationChallenge({
      purpose: "REGISTER",
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash: await hashPassword(input.password),
      role: input.accountType,
      inviteCode: input.inviteCode,
      requestIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({ success: true, challengeId });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
