import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DeleteButton } from "./delete-btn";

export default async function MyPostsPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;
  const { sort } = await searchParams;

  const orderBy: Record<string, unknown> = { updatedAt: "desc" };
  if (sort === "title") orderBy.title = "asc" as const;
  else if (sort === "created") orderBy.createdAt = "desc" as const;
  else if (sort === "category") orderBy.categoryId = "asc" as const;

  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: { category: true },
    orderBy,
  });

  // 计算字数
  function wordCount(content: string) {
    return content.replace(/[#*`~\[\]()>!\-\s|]/g, "").length;
  }

  const statusLabel: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
    ARCHIVED: "已归档",
  };

  const sortOptions = [
    { value: "updated", label: "最近更新" },
    { value: "created", label: "创建时间" },
    { value: "title", label: "标题 (拼音)" },
    { value: "category", label: "按分类" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">我的文章</h1>
        <Link href="/dashboard/editor" className="btn-primary text-sm">写新文章</Link>
      </div>

      {/* 排序选项 */}
      <div className="flex gap-2 mb-4 font-[family-name:var(--font-sans)] text-sm">
        <span className="text-[#6b6b6b]">排序：</span>
        {sortOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/posts?sort=${opt.value}`}
            className={`px-2 py-0.5 rounded transition-colors ${(sort || "updated") === opt.value ? "bg-[#8b5e3c] text-white" : "text-[#6b6b6b] hover:text-[#8b5e3c]"}`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="text-[#6b6b6b]">
          暂无文章，<Link href="/dashboard/editor" className="text-[#8b5e3c]">写第一篇</Link>
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="card flex items-center justify-between flex-wrap gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/editor/${post.id}`} className="font-bold text-[#1a1a1a] hover:text-[#8b5e3c] transition-colors">
                    {post.title || "未命名文章"}
                  </Link>
                  <span className={`tag text-xs ${post.status === "PUBLISHED" ? "bg-green-100 text-green-700" : post.status === "DRAFT" ? "bg-amber-100 text-amber-700" : ""}`}>
                    {statusLabel[post.status]}
                  </span>
                </div>
                <div className="text-xs text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
                  <span>{post.updatedAt.toLocaleDateString("zh-CN")}</span>
                  <span className="ml-2">{wordCount(post.content)} 字</span>
                  {post.category && <span className="ml-2">{post.category.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {post.status === "PUBLISHED" && (
                  <Link
                    href={`/${post.category?.type === "COMPETITION" ? "competition" : "knowledge-base"}/${post.category?.slug ?? "uncategorized"}/${post.slug}`}
                    className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
                    target="_blank"
                  >
                    查看
                  </Link>
                )}
                <DeleteButton slug={post.slug} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
