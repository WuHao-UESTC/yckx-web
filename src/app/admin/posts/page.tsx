import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { changePostStatusFormSchema, resourceIdSchema } from "@/modules/admin/admin.schemas";
import { requireAdmin } from "@/server/auth/guards";
import { parseFormData } from "@/server/http/validation";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const perPage = 20;

  const where: Prisma.PostWhereInput = q
    ? { OR: [{ title: { contains: q } }, { content: { contains: q } }] }
    : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { author: { select: { displayName: true, username: true } }, category: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where }),
  ]);

  async function togglePin(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = resourceIdSchema.parse(formData.get("id"));
    const post = await prisma.post.findUniqueOrThrow({ where: { id }, select: { isPinned: true } });
    await prisma.post.update({ where: { id }, data: { isPinned: !post.isPinned } });
    revalidatePath("/admin/posts");
  }

  async function toggleFeatured(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = resourceIdSchema.parse(formData.get("id"));
    const post = await prisma.post.findUniqueOrThrow({
      where: { id },
      select: { isFeatured: true },
    });
    await prisma.post.update({ where: { id }, data: { isFeatured: !post.isFeatured } });
    revalidatePath("/admin/posts");
  }

  async function changeStatus(formData: FormData) {
    "use server";
    await requireAdmin();
    const input = parseFormData(formData, changePostStatusFormSchema);
    await prisma.post.update({
      where: { id: input.id },
      data: {
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? new Date() : undefined,
      },
    });
    revalidatePath("/admin/posts");
  }

  const statusLabel: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
    ARCHIVED: "已归档",
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">文章管理</h1>

      <form className="flex gap-3 mb-6">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="搜索文章标题…"
          className="input-field flex-1 max-w-sm"
        />
        <button type="submit" className="btn-primary text-sm">
          搜索
        </button>
      </form>

      <p className="text-sm text-[#6b6b6b] mb-4 font-[family-name:var(--font-sans)]">
        共 {total} 篇文章
      </p>

      <div className="space-y-1">
        {posts.map((post) => (
          <div
            key={post.id}
            className="card flex items-center justify-between flex-wrap gap-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/editor/${post.id}`}
                  className="font-bold text-[#1a1a1a] hover:text-[#8b5e3c] truncate"
                >
                  {post.title || "未命名"}
                </Link>
                {post.isPinned && <span className="tag text-xs bg-red-50 text-red-600">置顶</span>}
                {post.isFeatured && (
                  <span className="tag text-xs bg-amber-50 text-amber-700">精选</span>
                )}
                <span
                  className={`tag text-xs ${post.status === "PUBLISHED" ? "bg-green-50 text-green-700" : post.status === "DRAFT" ? "bg-stone-50 text-stone-600" : "bg-gray-50 text-gray-500"}`}
                >
                  {statusLabel[post.status]}
                </span>
              </div>
              <p className="text-xs text-[#6b6b6b] mt-0.5 font-[family-name:var(--font-sans)]">
                {post.author.displayName ?? post.author.username} ·{" "}
                {post.category?.name || "无分类"} · {post.updatedAt.toLocaleDateString("zh-CN")}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* 置顶 */}
              <form action={togglePin}>
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="isPinned" value={String(post.isPinned)} />
                <button
                  className={`text-xs px-1.5 py-0.5 rounded border font-[family-name:var(--font-sans)] ${post.isPinned ? "bg-red-50 border-red-200 text-red-600" : "border-[#e8e0d5] text-[#6b6b6b]"}`}
                >
                  {post.isPinned ? "取消置顶" : "置顶"}
                </button>
              </form>
              {/* 精选 */}
              <form action={toggleFeatured}>
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="isFeatured" value={String(post.isFeatured)} />
                <button
                  className={`text-xs px-1.5 py-0.5 rounded border font-[family-name:var(--font-sans)] ${post.isFeatured ? "bg-amber-50 border-amber-200 text-amber-700" : "border-[#e8e0d5] text-[#6b6b6b]"}`}
                >
                  {post.isFeatured ? "取消精选" : "精选"}
                </button>
              </form>
              {/* 状态切换 */}
              <form action={changeStatus} className="flex items-center gap-1">
                <input type="hidden" name="id" value={post.id} />
                <select
                  name="status"
                  defaultValue={post.status}
                  className="text-xs border border-[#e8e0d5] rounded px-1 py-0.5 bg-white font-[family-name:var(--font-sans)]"
                >
                  <option value="DRAFT">草稿</option>
                  <option value="PUBLISHED">已发布</option>
                  <option value="ARCHIVED">归档</option>
                </select>
                <button
                  type="submit"
                  className="text-[10px] text-[#8b5e3c] px-1 font-[family-name:var(--font-sans)]"
                >
                  ✓
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {total > perPage && (
        <div className="flex justify-center gap-4 mt-6 font-[family-name:var(--font-sans)]">
          {page > 1 && (
            <Link
              href={`/admin/posts?page=${page - 1}${q ? `&q=${q}` : ""}`}
              className="btn-primary text-sm"
            >
              ← 上一页
            </Link>
          )}
          {page * perPage < total && (
            <Link
              href={`/admin/posts?page=${page + 1}${q ? `&q=${q}` : ""}`}
              className="btn-primary text-sm"
            >
              下一页 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
