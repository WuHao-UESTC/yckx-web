import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { ArticleOutline } from "@/components/article/article-outline";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 flex justify-center gap-10">
      {/* 正文区域 */}
      <div className="min-w-0 max-w-3xl flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] leading-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
            <span>{post.author.displayName ?? post.author.username}</span>
            <span>·</span>
            <time>{post.createdAt.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time>
          </div>
        </header>
        <MarkdownRenderer content={post.content} />
      </div>

      {/* 右侧大纲 */}
      <ArticleOutline content={post.content} />
    </div>
  );
}
