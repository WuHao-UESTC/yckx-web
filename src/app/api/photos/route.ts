import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUploadedPhotoSchema } from "@/modules/gallery/photos.schemas";
import { createPhotoFromUpload } from "@/modules/gallery/server/photo-service";
import { requireUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

// GET: 照片列表
export async function GET() {
  const photos = await prisma.photo.findMany({
    where: { isVisible: true },
    include: { author: { select: { displayName: true, username: true } } },
    orderBy: { sortOrder: "asc" },
    take: 50,
  });
  return NextResponse.json(photos);
}

// POST: 发布成员上传的日常照片
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = await parseJson(req, createUploadedPhotoSchema);
    const photo = await createPhotoFromUpload(input, user.id);

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
