import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetRequestSchema } from "@/modules/auth/auth.schemas";
import { createVerificationChallenge } from "@/modules/auth/server/verification";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(request, passwordResetRequestSchema);
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    let challengeId: string | null = null;
    if (user) {
      challengeId = await createVerificationChallenge({
        purpose: "RESET_PASSWORD",
        email: input.email,
        userId: user.id,
        requestIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      });
    }

    return NextResponse.json({ success: true, challengeId });
  } catch (error) {
    // Keep reset requests intentionally vague, but still return validation and rate-limit errors.
    return routeErrorResponse(error);
  }
}
