import "server-only";

import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/server/auth/guards";
import { assertOwnerOrAdmin } from "@/server/auth/guards";
import { BadRequestError, NotFoundError } from "@/server/http/errors";

export async function createPhotoFromUpload(
  input: { fileId: string; caption?: string | null },
  authorId: string
) {
  return prisma.$transaction(async (tx) => {
    const file = await tx.file.findUnique({
      where: { id: input.fileId },
      select: {
        id: true,
        uploaderId: true,
        mimeType: true,
        purpose: true,
        postId: true,
        photo: { select: { id: true } },
      },
    });

    if (!file) throw new NotFoundError("上传文件不存在");
    if (file.uploaderId !== authorId) throw new BadRequestError("只能发布自己上传的照片");
    if (!file.mimeType.startsWith("image/") || file.purpose !== "PHOTO") {
      throw new BadRequestError("请选择通过日常照片入口上传的图片");
    }
    if (file.postId || file.photo) throw new BadRequestError("该文件已被其他内容使用");

    const latest = await tx.photo.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return tx.photo.create({
      data: {
        imagePath: `/api/files/${file.id}/preview`,
        caption: input.caption || null,
        fileId: file.id,
        authorId,
        sortOrder: (latest?.sortOrder ?? 0) + 1,
      },
      include: { author: { select: { displayName: true, username: true } } },
    });
  });
}

export async function deletePhoto(id: string, user: AuthenticatedUser): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const photo = await tx.photo.findUnique({
      where: { id },
      select: { id: true, authorId: true, fileId: true },
    });
    if (!photo) throw new NotFoundError("照片不存在");
    assertOwnerOrAdmin(user, photo.authorId);

    await tx.photo.delete({ where: { id: photo.id } });
    if (photo.fileId) {
      await tx.file.update({
        where: { id: photo.fileId },
        data: { purpose: "GENERAL" },
      });
    }
  });
}
