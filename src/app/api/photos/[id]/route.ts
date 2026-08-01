import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: 编辑照片（管理员）
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "仅管理员" }, { status: 403 });

  const { id } = await params;
  const { caption, sortOrder } = await req.json();

  const data: Record<string, unknown> = {};
  if (caption !== undefined) data.caption = caption?.trim() || null;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const photo = await prisma.photo.update({ where: { id }, data });
  return NextResponse.json(photo);
}

// DELETE: 删除照片（管理员）
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "仅管理员" }, { status: 403 });

  const { id } = await params;
  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
