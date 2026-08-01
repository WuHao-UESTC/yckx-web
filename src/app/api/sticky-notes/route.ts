import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COLORS = ["yellow", "pink", "blue", "green", "purple", "orange"];

// POST: 发布便签（登录用户）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { content, isAnonymous } = await req.json();
  if (!content?.trim() || content.length > 200) {
    return NextResponse.json({ error: "内容1-200字" }, { status: 400 });
  }

  const note = await prisma.stickyNote.create({
    data: {
      content: content.trim(),
      isAnonymous: !!isAnonymous,
      authorId: (session.user as { id: string }).id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    },
    include: { author: { select: { displayName: true, username: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
