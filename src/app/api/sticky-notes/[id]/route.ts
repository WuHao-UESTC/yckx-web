import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE: 删除便签（作者或管理员）
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const { id } = await params;
  const note = await prisma.stickyNote.findUnique({ where: { id }, select: { authorId: true } });
  if (!note) return NextResponse.json({ error: "不存在" }, { status: 404 });

  if (note.authorId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await prisma.stickyNote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
