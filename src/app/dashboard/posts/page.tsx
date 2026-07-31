import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MyPostsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  const statusLabel: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
    ARCHIVED: "已归档",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">我的文章</h1>
        <Link href="/dashboard/editor" className="btn-primary text-sm">写新文章</Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-[#6b6b6b]">暂无文章，<Link href="/dashboard/editor" className="text-[#8b5e3c]">写第一篇</Link></p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="card flex items-center justify-between">
              <div className="min-w-0">
                <Link href={`/dashboard/editor/${post.id}`} className="font-bold text-[#1a1a1a] hover:text-[#8b5e3c] transition-colors">
                  {post.title || "未命名文章"}
                </Link>
                <div className="text-xs text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
                  <span className={`tag ${post.status === "PUBLISHED" ? "bg-green-100 text-green-700" : ""}`}>
                    {statusLabel[post.status]}
                  </span>
                  <span className="ml-2">{post.updatedAt.toLocaleDateString("zh-CN")}</span>
                  {post.category && <span className="ml-2">{post.category.name}</span>}
                </div>
              </div>
              {post.status === "PUBLISHED" && (
                <Link
                  href={`/${post.category?.type === "COMPETITION" ? "competition" : "knowledge-base"}/${post.category?.slug ?? "uncategorized"}/${post.slug}`}
                  className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] shrink-0 font-[family-name:var(--font-sans)]"
                  target="_blank"
                >
                  查看 →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
