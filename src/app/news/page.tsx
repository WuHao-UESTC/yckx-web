import { Newspaper } from "lucide-react";
import { PostCard } from "@/components/article/post-card";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export default async function NewsPage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", category: { slug: "news" } },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-8 border-b border-[#d7e4ea] pb-5">
        <div className="mb-2 flex items-center gap-2 text-[#0b6d9b]">
          <Newspaper size={20} aria-hidden="true" />
          <span className="font-[family-name:var(--font-mono)] text-xs">
            SCIENCE ASSOCIATION LOG
          </span>
        </div>
        <h1 className="m-0 text-3xl font-bold text-[#071d34]">科协新闻</h1>
        <p className="mt-2 text-sm text-[#60788d]">按发布时间从新到旧收录科协的活动与进展。</p>
      </header>

      <div className="space-y-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} showTags />
        ))}
        {posts.length === 0 && (
          <p className="rounded-md border border-dashed border-[#b9d1dc] px-5 py-10 text-center text-sm text-[#60788d]">
            暂无公开新闻稿。
          </p>
        )}
      </div>
    </div>
  );
}
