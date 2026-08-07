import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/guards";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import {
  createContentDisposition,
  getOptimizedImagePath,
  resolveStoredPath,
} from "@/server/storage/file-storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        post: { select: { status: true, authorId: true } },
      },
    });

    if (!file) throw new NotFoundError("文件不存在");
    const canPreviewInline =
      file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
    if (!canPreviewInline) throw new BadRequestError("该文件不支持内联预览");

    const isPublicFile = file.photo?.isVisible === true || file.post?.status === "PUBLISHED";
    if (!isPublicFile) {
      const user = await requireUser();
      const canReadPrivateFile =
        user.role === "ADMIN" || user.id === file.uploaderId || user.id === file.post?.authorId;
      if (!canReadPrivateFile) throw new ForbiddenError("无权预览该文件");
    }

    const useOriginal = req.nextUrl.searchParams.get("variant") === "original";
    let responsePath = resolveStoredPath(file.storedPath);
    let optimized = false;
    if (file.mimeType.startsWith("image/") && !useOriginal) {
      try {
        responsePath = await getOptimizedImagePath(file.storedPath);
        optimized = true;
      } catch {
        // Legacy or partially corrupt images still remain readable as originals.
      }
    }
    const responseType = optimized ? "image/webp" : file.mimeType;
    const responseStat = await stat(responsePath);
    const etag = `W/\"${responseStat.size}-${Math.trunc(responseStat.mtimeMs)}\"`;
    const cacheControl = isPublicFile
      ? "public, max-age=3600, stale-while-revalidate=86400"
      : "private, no-store";

    if (isPublicFile && req.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": cacheControl },
      });
    }

    const content = Readable.toWeb(createReadStream(responsePath)) as ReadableStream<Uint8Array>;
    return new NextResponse(content, {
      headers: {
        "Content-Type": responseType,
        "Content-Length": String(responseStat.size),
        "Content-Disposition": createContentDisposition("inline", file.filename),
        "Cache-Control": cacheControl,
        ETag: etag,
        "Last-Modified": responseStat.mtime.toUTCString(),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
