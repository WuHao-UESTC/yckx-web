import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 照片列表
export async function GET() {
  const photos = await prisma.photo.findMany({
    include: { author: { select: { displayName: true, username: true } } },
    orderBy: { sortOrder: "asc" },
    take: 50,
  });
  return NextResponse.json(photos);
}

// POST: 新增照片（管理员）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "仅管理员" }, { status: 403 });

  const { imagePath, caption } = await req.json();
  if (!imagePath?.trim()) return NextResponse.json({ error: "图片地址不能为空" }, { status: 400 });

  const maxOrder = await prisma.photo.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });

  const photo = await prisma.photo.create({
    data: {
      imagePath: imagePath.trim(),
      caption: caption?.trim() || null,
      authorId: (session.user as { id: string }).id,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
