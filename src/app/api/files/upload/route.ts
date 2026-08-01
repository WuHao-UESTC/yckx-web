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

  // 读取文件内容（一次性）
  const bytes = Buffer.from(await file.arrayBuffer());

  // 文件头魔数验证（防止伪造 MIME 类型）
  const magicValid = validateMagicBytes(file.type, bytes.subarray(0, 8));
  if (!magicValid) {
    return NextResponse.json({ error: "文件类型与实际内容不符" }, { status: 400 });
  }

  // 用户配额检查（200MB）
  const userFiles = await prisma.file.findMany({ where: { uploaderId: userId }, select: { size: true } });
  const usedBytes = userFiles.reduce((sum, f) => sum + f.size, 0);
  const maxBytes = 200 * 1024 * 1024; // 200MB
  if (usedBytes + file.size > maxBytes) {
    return NextResponse.json({ error: `存储空间不足，已使用 ${(usedBytes / 1024 / 1024).toFixed(0)}MB / 200MB` }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "";
  const storedName = `${uuidv4()}.${ext}`;
  const uploadDir = process.env.UPLOAD_DIR || "/volume1/dev/yckx/uploads";
  await mkdir(uploadDir, { recursive: true });
  const storedPath = path.join(uploadDir, storedName);
  await writeFile(storedPath, bytes);

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

/** 常见文件头魔数验证 */
function validateMagicBytes(mimeType: string, header: Buffer): boolean {
  const signatures: Record<string, number[]> = {
    "application/pdf": [0x25, 0x50, 0x44, 0x46],                          // %PDF
    "application/zip": [0x50, 0x4B, 0x03, 0x04],                          // PK..
    "application/x-rar-compressed": [0x52, 0x61, 0x72, 0x21],             // Rar!
    "image/jpeg": [0xFF, 0xD8, 0xFF],                                      // ÿØÿ
    "image/png": [0x89, 0x50, 0x4E, 0x47],                                // .PNG
    "image/webp": [0x52, 0x49, 0x46, 0x46],                               // RIFF
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [0x50, 0x4B, 0x03, 0x04], // PK..
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [0x50, 0x4B, 0x03, 0x04],      // PK..
  };

  const sig = signatures[mimeType];
  if (!sig) return true; // 未知类型跳过魔数检查
  return sig.every((byte, i) => header[i] === byte);
}
