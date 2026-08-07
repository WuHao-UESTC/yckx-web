import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { requireUser } from "@/server/auth/guards";
import { ForbiddenError, NotFoundError } from "@/server/http/errors";
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
        post: { select: { status: true, authorId: true } },
      },
    });

    if (!file) throw new NotFoundError("文件不存在");

    const isPublicAttachment = file.post?.status === "PUBLISHED";
    if (!isPublicAttachment) {
      const user = await requireUser();
      const canReadPrivateFile =
        user.role === "ADMIN" || user.id === file.uploaderId || user.id === file.post?.authorId;
      if (!canReadPrivateFile) throw new ForbiddenError("无权下载该文件");
    }

    const responsePath = resolveStoredPath(file.storedPath);
    const responseStat = await stat(responsePath);
    const content = Readable.toWeb(createReadStream(responsePath)) as ReadableStream<Uint8Array>;
    return new NextResponse(content, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(responseStat.size),
        "Content-Disposition": createContentDisposition("attachment", file.filename),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
