import "server-only";

import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { MAX_AVATAR_FILE_SIZE, MAX_USER_STORAGE } from "@/lib/constants";
import { BadRequestError, NotFoundError } from "@/server/http/errors";
import { removeStoredFile, storeFile, validateFileContent } from "@/server/storage/file-storage";

const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

async function removeStoredAvatar(storedPath: string | null): Promise<void> {
  if (!storedPath) return;
  await removeStoredFile(storedPath).catch((error) => {
    console.error("Failed to remove replaced avatar", { storedPath, error });
  });
}

export async function replaceUserAvatar(userId: string, file: File) {
  if (!file.name.trim() || file.name.length > 255) throw new BadRequestError("头像文件名无效");
  if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
    throw new BadRequestError("头像只支持 JPEG、PNG 和 WebP");
  }
  if (file.size <= 0 || file.size > MAX_AVATAR_FILE_SIZE) {
    throw new BadRequestError("头像文件必须在 1 字节到 5MB 之间");
  }

  const original = Buffer.from(await file.arrayBuffer());
  validateFileContent(file.type, original);

  let content: Buffer;
  try {
    content = await sharp(original)
      .rotate()
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 86 })
      .toBuffer();
  } catch {
    throw new BadRequestError("头像图片无法解码");
  }

  const [user, quota] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        avatarFile: { select: { id: true, storedPath: true, size: true } },
      },
    }),
    prisma.file.aggregate({ where: { uploaderId: userId }, _sum: { size: true } }),
  ]);
  if (!user) throw new NotFoundError("用户不存在");

  const usedBytes = (quota._sum.size ?? 0) - (user.avatarFile?.size ?? 0);
  if (usedBytes + content.length > MAX_USER_STORAGE) {
    throw new BadRequestError("存储空间不足，请先清理私有文件");
  }

  let storedPath: string | null = await storeFile("image/webp", content);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const avatarFile = await tx.file.create({
        data: {
          filename: `${file.name.replace(/\.[^.]+$/, "") || "avatar"}.webp`,
          storedPath: storedPath!,
          mimeType: "image/webp",
          size: content.length,
          purpose: "AVATAR",
          uploaderId: userId,
        },
        select: { id: true },
      });
      const avatar = `/api/files/${avatarFile.id}/avatar`;

      await tx.user.update({
        where: { id: userId },
        data: { avatar, avatarFile: { connect: { id: avatarFile.id } } },
      });
      await tx.profile.updateMany({ where: { userId }, data: { avatarUrl: null } });
      if (user.avatarFile) await tx.file.delete({ where: { id: user.avatarFile.id } });

      return { avatar, fileId: avatarFile.id };
    });

    storedPath = null;
    await removeStoredAvatar(user.avatarFile?.storedPath ?? null);
    return result;
  } catch (error) {
    if (storedPath) await removeStoredFile(storedPath).catch(() => undefined);
    throw error;
  }
}

export async function removeUserAvatar(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarFile: { select: { id: true, storedPath: true } } },
  });
  if (!user) throw new NotFoundError("用户不存在");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { avatar: null, avatarFile: { disconnect: true } },
    });
    await tx.profile.updateMany({ where: { userId }, data: { avatarUrl: null } });
    if (user.avatarFile) await tx.file.delete({ where: { id: user.avatarFile.id } });
  });

  await removeStoredAvatar(user.avatarFile?.storedPath ?? null);
}
