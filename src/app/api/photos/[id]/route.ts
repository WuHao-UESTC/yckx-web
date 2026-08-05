import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePhotoSchema } from "@/modules/gallery/photos.schemas";
import { deletePhoto } from "@/modules/gallery/server/photo-service";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";
import { NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

// PATCH: 编辑自己的照片，管理员可管理全部照片
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const input = await parseJson(req, updatePhotoSchema);
    const existing = await prisma.photo.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!existing) throw new NotFoundError("照片不存在");
    assertOwnerOrAdmin(user, existing.authorId);
    const photo = await prisma.photo.update({
      where: { id },
      data: {
        caption: input.caption === undefined ? undefined : input.caption || null,
        sortOrder: input.sortOrder,
        isVisible: input.isVisible,
      },
    });
    return NextResponse.json(photo);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

// DELETE: 删除自己的照片，管理员可删除全部照片
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deletePhoto(id, user);
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
