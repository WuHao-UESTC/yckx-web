import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { movePhotoFormSchema, resourceIdSchema } from "@/modules/admin/admin.schemas";
import { createPhotoSchema } from "@/modules/gallery/photos.schemas";
import { AdminGroupPhotoUploader } from "@/modules/gallery/components/admin-group-photo-uploader";
import { deletePhoto as deletePhotoRecord } from "@/modules/gallery/server/photo-service";
import { requireAdmin } from "@/server/auth/guards";
import { parseFormData } from "@/server/http/validation";

export default async function AdminPhotosPage() {
  await requireAdmin();
  const photos = await prisma.photo.findMany({
    include: { author: { select: { displayName: true, username: true } } },
    orderBy: [{ kind: "desc" }, { sortOrder: "asc" }],
  });

  async function addPhoto(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const input = parseFormData(formData, createPhotoSchema);

    const maxOrder = await prisma.photo.findFirst({
      where: { kind: "WALL" },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.photo.create({
      data: {
        imagePath: input.imagePath,
        caption: input.caption || null,
        kind: "WALL",
        authorId: user.id,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });
    revalidatePath("/admin/photos");
    revalidatePath("/routine");
  }

  async function deletePhoto(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const id = resourceIdSchema.parse(formData.get("id"));
    await deletePhotoRecord(id, user);
    revalidatePath("/admin/photos");
    revalidatePath("/routine");
  }

  async function togglePhoto(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = resourceIdSchema.parse(formData.get("id"));
    const photo = await prisma.photo.findUniqueOrThrow({
      where: { id },
      select: { isVisible: true },
    });
    await prisma.photo.update({ where: { id }, data: { isVisible: !photo.isVisible } });
    revalidatePath("/admin/photos");
    revalidatePath("/routine");
  }

  async function movePhoto(formData: FormData) {
    "use server";
    await requireAdmin();
    const input = parseFormData(formData, movePhotoFormSchema);
    const current = await prisma.photo.findUniqueOrThrow({
      where: { id: input.id },
      select: { kind: true, sortOrder: true },
    });

    const sibling =
      input.direction === "up"
        ? await prisma.photo.findFirst({
            where: { kind: current.kind, sortOrder: { lt: current.sortOrder } },
            orderBy: { sortOrder: "desc" },
            select: { id: true, sortOrder: true },
          })
        : await prisma.photo.findFirst({
            where: { kind: current.kind, sortOrder: { gt: current.sortOrder } },
            orderBy: { sortOrder: "asc" },
            select: { id: true, sortOrder: true },
          });

    if (sibling) {
      await prisma.$transaction([
        prisma.photo.update({ where: { id: input.id }, data: { sortOrder: sibling.sortOrder } }),
        prisma.photo.update({ where: { id: sibling.id }, data: { sortOrder: current.sortOrder } }),
      ]);
    }
    revalidatePath("/admin/photos");
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">日常影像管理</h1>

      <AdminGroupPhotoUploader />

      <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">普通照片墙快速添加</h2>
      <form action={addPhoto} className="card mb-8 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            图片 URL
          </label>
          <input
            name="imagePath"
            className="input-field w-full"
            required
            placeholder="https://... 或 /uploads/..."
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
            配文（可选）
          </label>
          <input name="caption" className="input-field w-full" placeholder="简短说明..." />
        </div>
        <button type="submit" className="btn-primary">
          添加照片
        </button>
      </form>

      <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">全部影像档案</h2>
      {photos.length === 0 ? (
        <p className="text-[#6b6b6b]">暂无照片。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className={`card p-2 group ${photo.isVisible ? "" : "opacity-50"}`}>
              <div className="aspect-square rounded-md overflow-hidden bg-[#f5f0e8] mb-2">
                <img
                  src={photo.imagePath}
                  alt={photo.caption ?? ""}
                  className="w-full h-full object-cover"
                />
              </div>
              {photo.caption && (
                <p className="text-xs text-[#6b6b6b] truncate px-1">{photo.caption}</p>
              )}
              <p className="text-xs text-[#6b6b6b] px-1">
                {photo.author.displayName ?? photo.author.username} ·{" "}
                {photo.kind === "GROUP" ? `顶部合照 · ${photo.year ?? "未标年份"}` : "普通照片墙"}
                {" · "}
                {photo.isVisible ? "公开" : "已隐藏"}
              </p>
              <div className="flex items-center justify-between mt-1.5 px-1">
                {/* 排序 */}
                <div className="flex gap-0.5">
                  <form action={movePhoto}>
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="sortOrder" value={photo.sortOrder} />
                    <button
                      name="direction"
                      value="up"
                      className="text-xs px-1.5 py-0.5 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] transition-colors"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={movePhoto}>
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="sortOrder" value={photo.sortOrder} />
                    <button
                      name="direction"
                      value="down"
                      className="text-xs px-1.5 py-0.5 rounded border border-[#e8e0d5] hover:bg-[#f0ebe0] transition-colors"
                    >
                      ↓
                    </button>
                  </form>
                </div>
                {/* 删除 */}
                <form action={deletePhoto}>
                  <input type="hidden" name="id" value={photo.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-700 font-[family-name:var(--font-sans)]"
                  >
                    删除
                  </button>
                </form>
                <form action={togglePhoto}>
                  <input type="hidden" name="id" value={photo.id} />
                  <button
                    type="submit"
                    className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
                  >
                    {photo.isVisible ? "隐藏" : "恢复"}
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
