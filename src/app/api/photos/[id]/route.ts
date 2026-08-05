import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePhotoSchema } from "@/modules/gallery/photos.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

// PATCH: 编辑照片（管理员）
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await parseJson(req, updatePhotoSchema);
    const photo = await prisma.photo.update({
      where: { id },
      data: {
        caption: input.caption === undefined ? undefined : input.caption || null,
        sortOrder: input.sortOrder,
      },
    });
    return NextResponse.json(photo);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

// DELETE: 删除照片（管理员）
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const result = await prisma.photo.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundError("照片不存在");
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
