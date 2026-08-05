import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/modules/auth/auth.schemas";
import { hashPassword } from "@/modules/auth/server/password";
import { BadRequestError, ConflictError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

function isRetryableTransactionError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, registerSchema);
    const passwordHash = await hashPassword(input.password);
    let userId: string | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        userId = await prisma.$transaction(
          async (tx) => {
            const invitation = await tx.invitation.findUnique({
              where: { code: input.inviteCode },
            });

            if (!invitation) throw new BadRequestError("邀请码不存在");
            if (!invitation.isActive) throw new BadRequestError("邀请码已禁用");
            if (invitation.expiresAt && invitation.expiresAt < new Date()) {
              throw new BadRequestError("邀请码已过期");
            }
            if (invitation.usedCount >= invitation.maxUses) {
              throw new BadRequestError("邀请码已用完");
            }

            const existing = await tx.user.findFirst({
              where: { OR: [{ email: input.email }, { username: input.username }] },
              select: { email: true },
            });

            if (existing) {
              throw new ConflictError(
                existing.email === input.email ? "邮箱已被注册" : "用户名已被占用"
              );
            }

            const user = await tx.user.create({
              data: {
                email: input.email,
                username: input.username,
                passwordHash,
                profile: { create: {} },
              },
              select: { id: true },
            });

            await tx.invitation.update({
              where: { id: invitation.id },
              data: { usedCount: { increment: 1 } },
            });

            return user.id;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );
        break;
      } catch (error) {
        if (attempt < 2 && isRetryableTransactionError(error)) continue;
        throw error;
      }
    }

    if (!userId) throw new ConflictError("注册请求发生冲突，请重试");

    return NextResponse.json({ success: true, userId }, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
