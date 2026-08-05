import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";
import { NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { resolveStoredPath } from "@/server/storage/file-storage";

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
        post: { select: { status: true } },
      },
    });

    if (!file) throw new NotFoundError("文件不存在");

    const isPublicAttachment = file.post?.status === "PUBLISHED";
    if (!isPublicAttachment) {
      const user = await requireUser();
      assertOwnerOrAdmin(user, file.uploaderId);
    }

    const content = await readFile(/*turbopackIgnore: true*/ resolveStoredPath(file.storedPath));
    return new NextResponse(content, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
        "Cache-Control": isPublicAttachment ? "public, max-age=3600" : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
