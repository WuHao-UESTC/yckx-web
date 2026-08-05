import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MAX_USER_STORAGE } from "@/lib/constants";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";
import { BadRequestError, NotFoundError } from "@/server/http/errors";
import { resourceIdSchema } from "@/modules/admin/admin.schemas";
import { removeStoredFile } from "@/server/storage/file-storage";

export default async function FilesPage() {
  const user = await requireUser();
  const userId = user.id;

  const files = await prisma.file.findMany({
    where: { uploaderId: userId },
    include: {
      post: { select: { title: true, slug: true, status: true } },
      photo: { select: { id: true, isVisible: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
  const maxBytes = MAX_USER_STORAGE;
  const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
  const maxMB = (maxBytes / 1024 / 1024).toFixed(0);

  async function deleteFile(formData: FormData) {
    "use server";
    const currentUser = await requireUser();
    const id = resourceIdSchema.parse(formData.get("id"));
    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        uploaderId: true,
        storedPath: true,
        post: { select: { status: true } },
        photo: { select: { id: true } },
      },
    });
    if (!file) throw new NotFoundError("文件不存在");
    assertOwnerOrAdmin(currentUser, file.uploaderId);
    if (file.post?.status === "PUBLISHED") {
      throw new BadRequestError("请先在文章编辑器中解除已发布附件的关联");
    }
    if (file.photo) throw new BadRequestError("请先删除对应的日常照片");

    await prisma.file.delete({ where: { id } });
    await removeStoredFile(file.storedPath).catch((error) => {
      console.error("Failed to remove stored file", { id, error });
    });
    revalidatePath("/dashboard/files");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">文件管理</h1>
      <p className="text-sm text-[#6b6b6b] mb-6 font-[family-name:var(--font-sans)]">
        已使用 {usedMB} MB / {maxMB} MB
        <span className="ml-2 text-xs">（单文件上限 20MB）</span>
      </p>

      {/* 配额进度条 */}
      <div className="w-full max-w-xs h-2 bg-[#e8e0d5] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[#8b5e3c] rounded-full transition-all"
          style={{ width: `${Math.min(100, (usedBytes / maxBytes) * 100)}%` }}
        />
      </div>

      {files.length === 0 ? (
        <p className="text-[#6b6b6b] text-sm">暂无文件。</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="card flex items-center justify-between flex-wrap gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/files/${f.id}`}
                    className="font-bold text-[#1a1a1a] hover:text-[#8b5e3c] text-sm truncate"
                  >
                    {f.filename}
                  </a>
                </div>
                <p className="text-xs text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
                  {(f.size / 1024).toFixed(0)} KB · {f.mimeType} ·{" "}
                  {f.createdAt.toLocaleDateString("zh-CN")}
                  {f.post && <span className="ml-2">附件：{f.post.title}</span>}
                  {f.photo && <span className="ml-2">日常照片</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/files/${f.id}`}
                  className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
                >
                  下载
                </a>
                <form action={deleteFile}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-700 font-[family-name:var(--font-sans)]"
                  >
                    删除
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
