import "server-only";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { BadRequestError } from "@/server/http/errors";

const MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

const MIME_SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "application/zip": [0x50, 0x4b, 0x03, 0x04],
  "application/x-rar-compressed": [0x52, 0x61, 0x72, 0x21],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [0x50, 0x4b],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [0x50, 0x4b],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [0x50, 0x4b],
};

export function getUploadDirectory(): string {
  const configured = process.env.UPLOAD_DIR?.trim();

  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("UPLOAD_DIR must be configured in production");
  }

  if (configured) {
    // The upload root is runtime configuration and must not be bundled by output file tracing.
    return path.resolve(/*turbopackIgnore: true*/ configured);
  }

  return path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");
}

export function resolveStoredPath(storedPath: string): string {
  const uploadDirectory = getUploadDirectory();
  const resolvedPath = path.resolve(/*turbopackIgnore: true*/ storedPath);
  const relativePath = path.relative(uploadDirectory, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Stored file path is outside UPLOAD_DIR");
  }

  return resolvedPath;
}

export function validateFileContent(mimeType: string, content: Buffer): void {
  const signature = MIME_SIGNATURES[mimeType];
  if (!signature || !MIME_EXTENSIONS[mimeType]) {
    throw new BadRequestError("不支持的文件类型");
  }

  const signatureMatches = signature.every((byte, index) => content[index] === byte);
  const webpMatches =
    mimeType !== "image/webp" || content.subarray(8, 12).toString("ascii") === "WEBP";

  if (!signatureMatches || !webpMatches) {
    throw new BadRequestError("文件类型与实际内容不符");
  }
}

export function createContentDisposition(
  disposition: "attachment" | "inline",
  filename: string
): string {
  const fallback = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function storeFile(mimeType: string, content: Buffer): Promise<string> {
  const extension = MIME_EXTENSIONS[mimeType];
  if (!extension) throw new BadRequestError("不支持的文件类型");

  const uploadDirectory = getUploadDirectory();
  await mkdir(uploadDirectory, { recursive: true });

  const storedPath = path.join(
    /* turbopackIgnore: true */ uploadDirectory,
    `${uuidv4()}.${extension}`
  );
  await writeFile(/*turbopackIgnore: true*/ storedPath, content, { flag: "wx" });
  return storedPath;
}

export async function removeStoredFile(storedPath: string): Promise<void> {
  const resolvedPath = resolveStoredPath(storedPath);
  await unlink(/*turbopackIgnore: true*/ resolvedPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
