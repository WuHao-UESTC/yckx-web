import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  try {
    const content = await readFile(file.storedPath);
    return new NextResponse(content, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "文件读取失败" }, { status: 500 });
  }
}
