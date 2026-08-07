import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { createContentDisposition, resolveStoredPath } from "@/server/storage/file-storage";

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
        purpose: true,
        avatarFor: { select: { id: true } },
      },
    });
    if (!file || file.purpose !== "AVATAR" || !file.avatarFor) {
      throw new NotFoundError("头像不存在");
    }

    const responsePath = resolveStoredPath(file.storedPath);
    const responseStat = await stat(responsePath);
    const etag = `W/\"${responseStat.size}-${Math.trunc(responseStat.mtimeMs)}\"`;
    const cacheControl = "public, max-age=86400, stale-while-revalidate=604800";

    if (req.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": cacheControl },
      });
    }

    const content = Readable.toWeb(createReadStream(responsePath)) as ReadableStream<Uint8Array>;
    return new NextResponse(content, {
      headers: {
        "Content-Type": file.mimeType,
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
