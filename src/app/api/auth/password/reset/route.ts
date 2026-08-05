import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetSchema } from "@/modules/auth/auth.schemas";
import { hashPassword } from "@/modules/auth/server/password";
import { consumeVerificationChallenge } from "@/modules/auth/server/verification";
import { BadRequestError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, passwordResetSchema);
    const challenge = await consumeVerificationChallenge(
      input.challengeId,
      input.code,
      "RESET_PASSWORD"
    );
    if (!challenge.userId) throw new BadRequestError("找回密码请求无效");

    await prisma.user.update({
      where: { id: challenge.userId },
      data: { passwordHash: await hashPassword(input.password), passwordChangedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
