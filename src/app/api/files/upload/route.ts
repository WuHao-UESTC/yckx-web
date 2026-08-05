import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_USER_STORAGE } from "@/lib/constants";
import { requireUser } from "@/server/auth/guards";
import { BadRequestError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { removeStoredFile, storeFile, validateFileContent } from "@/server/storage/file-storage";

export async function POST(req: NextRequest) {
  let storedPath: string | null = null;

  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file");
    const purposeValue = formData.get("purpose");
    const purpose =
      typeof purposeValue === "string" && ["GENERAL", "ATTACHMENT", "PHOTO"].includes(purposeValue)
        ? (purposeValue as "GENERAL" | "ATTACHMENT" | "PHOTO")
        : "GENERAL";

    if (!(file instanceof File)) throw new BadRequestError("未选择文件");
    if (!file.name.trim() || file.name.length > 255) {
      throw new BadRequestError("文件名无效");
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new BadRequestError("不支持的文件类型");
    }
    if (purpose === "PHOTO" && !file.type.startsWith("image/")) {
      throw new BadRequestError("日常照片只支持 JPEG、PNG 和 WebP");
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      throw new BadRequestError("文件大小必须在 1 字节到 20MB 之间");
    }

    const quota = await prisma.file.aggregate({
      where: { uploaderId: user.id },
      _sum: { size: true },
    });
    const usedBytes = quota._sum.size ?? 0;
    if (usedBytes + file.size > MAX_USER_STORAGE) {
      throw new BadRequestError(
        `存储空间不足，已使用 ${(usedBytes / 1024 / 1024).toFixed(0)}MB / 200MB`
      );
    }

    const content = Buffer.from(await file.arrayBuffer());
    validateFileContent(file.type, content);
    storedPath = await storeFile(file.type, content);

    const record = await prisma.file.create({
      data: {
        filename: file.name.trim(),
        storedPath,
        mimeType: file.type,
        size: file.size,
        purpose,
        uploaderId: user.id,
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        purpose: true,
        createdAt: true,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (storedPath) await removeStoredFile(storedPath).catch(() => undefined);
    return routeErrorResponse(error);
  }
}
