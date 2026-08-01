import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { ArticleOutline } from "@/components/article/article-outline";
import { MobileTOC } from "@/components/article/mobile-toc";
import { PostNav } from "@/components/article/post-nav";
import { GiscusComments } from "@/components/article/giscus-comments";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug }, select: { title: true, excerpt: true, coverImage: true } });
  if (!post) return { title: "未找到" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });
  if (!post) notFound();

  // 查询上/下篇（同类型 EVENT，按发布时间）
  const [prevPost, nextPost] = await Promise.all([
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            status: "PUBLISHED",
            category: { type: "EVENT" },
            publishedAt: { lt: post.publishedAt },
          },
          include: { author: { select: { id: true, username: true, displayName: true, avatar: true } }, category: true },
          orderBy: { publishedAt: "desc" },
        })
      : null,
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            status: "PUBLISHED",
            category: { type: "EVENT" },
            publishedAt: { gt: post.publishedAt },
          },
          include: { author: { select: { id: true, username: true, displayName: true, avatar: true } }, category: true },
          orderBy: { publishedAt: "asc" },
        })
      : null,
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 flex justify-center gap-10">
      {/* 正文区域 */}
      <div className="min-w-0 max-w-3xl flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] leading-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
            <span>{post.author.displayName ?? post.author.username}</span>
            <span>·</span>
            <time>{post.publishedAt?.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) ?? post.createdAt.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time>
          </div>
        </header>

        {/* 封面图 */}
        {post.coverImage && (
          <div className="mb-6 rounded-md overflow-hidden bg-[#f5f0e8]">
            <img src={post.coverImage} alt={post.title}
              className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        <MobileTOC content={post.content} />
        <MarkdownRenderer content={post.content} />

        {/* 底部标签 */}
        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-1.5">
            {post.tags.map((pt) => (
              <a key={pt.tag.id} href={`/tags/${pt.tag.slug}`} className="tag">{pt.tag.name}</a>
            ))}
          </div>
        )}

        <PostNav prev={prevPost} next={nextPost} />
        <GiscusComments />

        {/* 版权声明 */}
        <div className="mt-8 pt-6 border-t border-[#e8e0d5] text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          <p>© {post.author.displayName ?? post.author.username} · 英才科协</p>
          <p className="mt-1">未经许可，禁止转载。</p>
        </div>
      </div>

      {/* 右侧大纲 */}
      <ArticleOutline content={post.content} />
    </div>
  );
}
