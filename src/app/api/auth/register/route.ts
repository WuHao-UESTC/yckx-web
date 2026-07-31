import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInviteCode, hashPassword } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    const { email, username, password, inviteCode } = await request.json();

    // 校验必填字段
    if (!email || !username || !password || !inviteCode) {
      return NextResponse.json({ error: "请填写所有必填字段" }, { status: 400 });
    }

    // 校验邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "邮箱格式无效" }, { status: 400 });
    }

    // 校验用户名格式
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return NextResponse.json({ error: "用户名需为 3-20 位字母、数字、下划线或短横线" }, { status: 400 });
    }

    // 校验密码长度
    if (password.length < 8) {
      return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 });
    }

    // 校验邀请码
    const result = await verifyInviteCode(inviteCode);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    // 检查邮箱和用户名
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? "邮箱已被注册" : "用户名已被占用" },
        { status: 409 }
      );
    }

    // 创建用户 + 消费邀请码 + 创建资料
    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          profile: {
            create: {},
          },
        },
      });

      await tx.invitation.update({
        where: { id: result.invitation!.id },
        data: { usedCount: { increment: 1 } },
      });

      return newUser;
    });

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
