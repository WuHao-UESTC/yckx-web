import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";
import { BadRequestError, NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { createContentDisposition, resolveStoredPath } from "@/server/storage/file-storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        filename: true,
        storedPath: true,
        mimeType: true,
        size: true,
        uploaderId: true,
        photo: { select: { isVisible: true } },
      },
    });

    if (!file) throw new NotFoundError("文件不存在");
    if (!file.mimeType.startsWith("image/")) throw new BadRequestError("该文件不支持图片预览");

    const isPublicPhoto = file.photo?.isVisible === true;
    if (!isPublicPhoto) {
      const user = await requireUser();
      assertOwnerOrAdmin(user, file.uploaderId);
    }

    const content = await readFile(/*turbopackIgnore: true*/ resolveStoredPath(file.storedPath));
    return new NextResponse(content, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Content-Disposition": createContentDisposition("inline", file.filename),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
