import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verificationConfirmSchema } from "@/modules/auth/auth.schemas";
import { consumeVerificationChallenge } from "@/modules/auth/server/verification";
import { BadRequestError, ConflictError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, verificationConfirmSchema);
    const challenge = await consumeVerificationChallenge(input.challengeId, input.code, "REGISTER");
    if (!challenge.username || !challenge.passwordHash || !challenge.role) {
      throw new BadRequestError("注册信息不完整");
    }

    const email = challenge.email;
    const username = challenge.username;
    const passwordHash = challenge.passwordHash;
    const role = challenge.role;

    const userId = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.user.findFirst({
          where: { OR: [{ email }, { username }] },
          select: { email: true },
        });
        if (existing) {
          throw new ConflictError(
            existing.email === challenge.email ? "邮箱已被注册" : "用户名已被占用"
          );
        }

        if (role === "MEMBER") {
          if (!challenge.inviteCode) throw new BadRequestError("邀请码无效");
          const invitation = await tx.invitation.findUnique({
            where: { code: challenge.inviteCode },
          });
          if (
            !invitation ||
            !invitation.isActive ||
            (invitation.expiresAt && invitation.expiresAt < new Date()) ||
            invitation.usedCount >= invitation.maxUses
          ) {
            throw new BadRequestError("邀请码无效或已用完");
          }

          const user = await tx.user.create({
            data: {
              email,
              username,
              displayName: challenge.displayName,
              passwordHash,
              role,
              emailVerifiedAt: new Date(),
              profile: { create: {} },
            },
            select: { id: true },
          });
          await tx.invitation.update({
            where: { id: invitation.id },
            data: { usedCount: { increment: 1 } },
          });
          return user.id;
        }

        const user = await tx.user.create({
          data: {
            email,
            username,
            displayName: challenge.displayName,
            passwordHash,
            role: "GUEST",
            emailVerifiedAt: new Date(),
            profile: { create: {} },
          },
          select: { id: true },
        });
        return user.id;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json({ success: true, userId }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
