import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPhotoSchema } from "@/modules/gallery/photos.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

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
  try {
    const user = await requireAdmin();
    const input = await parseJson(req, createPhotoSchema);
    const maxOrder = await prisma.photo.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const photo = await prisma.photo.create({
      data: {
        imagePath: input.imagePath,
        caption: input.caption || null,
        authorId: user.id,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
