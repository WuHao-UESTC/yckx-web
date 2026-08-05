import "server-only";

import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/server/http/errors";
import { removeStoredFile } from "@/server/storage/file-storage";

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

export async function deleteAdminPosts(ids: string[]): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const result = await tx.post.deleteMany({ where: { id: { in: uniqueIds(ids) } } });
    await tx.tag.deleteMany({ where: { posts: { none: {} } } });
    return result.count;
  });
}

export async function deleteAdminTaxonomies(
  resource: "category" | "column",
  ids: string[]
): Promise<number> {
  const where = { id: { in: uniqueIds(ids) } };
  const result =
    resource === "category"
      ? await prisma.category.deleteMany({ where })
      : await prisma.column.deleteMany({ where });
  return result.count;
}

export async function deleteAdminInvitations(ids: string[]): Promise<number> {
  const result = await prisma.invitation.deleteMany({ where: { id: { in: uniqueIds(ids) } } });
  return result.count;
}

export async function deleteAdminUsers(ids: string[], currentAdminId: string): Promise<number> {
  const targetIds = uniqueIds(ids);
  if (targetIds.includes(currentAdminId)) {
    throw new ConflictError("不能删除当前登录的管理员账号");
  }

  const deletion = await prisma.$transaction(
    async (tx) => {
      const [targets, adminCount] = await Promise.all([
        tx.user.findMany({
          where: { id: { in: targetIds } },
          select: {
            id: true,
            role: true,
            files: { select: { id: true, storedPath: true } },
          },
        }),
        tx.user.count({ where: { role: "ADMIN" } }),
      ]);

      if (targets.length !== targetIds.length) throw new NotFoundError("部分用户不存在");
      const deletingAdminCount = targets.filter((user) => user.role === "ADMIN").length;
      if (adminCount - deletingAdminCount < 1) {
        throw new ConflictError("系统必须保留至少一名管理员");
      }

      const deleted = await tx.user.deleteMany({ where: { id: { in: targetIds } } });
      await tx.tag.deleteMany({ where: { posts: { none: {} } } });
      return { count: deleted.count, storedFiles: targets.flatMap((user) => user.files) };
    },
    { isolationLevel: "Serializable" }
  );

  for (let offset = 0; offset < deletion.storedFiles.length; offset += 16) {
    const batch = deletion.storedFiles.slice(offset, offset + 16);
    const cleanup = await Promise.allSettled(
      batch.map((file) => removeStoredFile(file.storedPath))
    );
    cleanup.forEach((outcome, index) => {
      if (outcome.status === "rejected") {
        console.error("Failed to remove deleted user's stored file", {
          fileId: batch[index]?.id,
          error: outcome.reason,
        });
      }
    });
  }

  return deletion.count;
}
