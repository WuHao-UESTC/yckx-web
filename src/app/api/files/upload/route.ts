import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 });
  }

  // 简单的大小和类型检查
  const allowedTypes = [
    "application/pdf", "application/zip", "application/x-rar-compressed",
    "image/jpeg", "image/png", "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "文件大小不能超过 20MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "";
  const storedName = `${uuidv4()}.${ext}`;
  const uploadDir = process.env.UPLOAD_DIR || "/volume1/dev/yckx/uploads";
  await mkdir(uploadDir, { recursive: true });
  const storedPath = path.join(uploadDir, storedName);
  const bytes = await file.arrayBuffer();
  await writeFile(storedPath, Buffer.from(bytes));

  const record = await prisma.file.create({
    data: {
      filename: file.name,
      storedPath,
      mimeType: file.type,
      size: file.size,
      uploaderId: userId,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
