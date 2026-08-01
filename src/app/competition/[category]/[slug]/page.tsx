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
  params: Promise<{ category: string; slug: string }>;
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

export default async function CompetitionArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
      tags: { include: { tag: true } },
      files: true,
    },
  });
  if (!post) notFound();
  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // 查询上/下篇（同分类，按发布时间）
  const [prevPost, nextPost] = await Promise.all([
    post.publishedAt
      ? prisma.post.findFirst({
          where: { status: "PUBLISHED", categoryId: post.categoryId, publishedAt: { lt: post.publishedAt } },
          include: { author: { select: { id: true, username: true, displayName: true, avatar: true } }, category: true },
          orderBy: { publishedAt: "desc" },
        })
      : null,
    post.publishedAt
      ? prisma.post.findFirst({
          where: { status: "PUBLISHED", categoryId: post.categoryId, publishedAt: { gt: post.publishedAt } },
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
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
            <span>{post.author.displayName ?? post.author.username}</span>
            <span>·</span>
            <time>{post.publishedAt?.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time>
            <span>·</span>
            <span>{post.viewCount} 次阅读</span>
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map((pt) => (
                <a key={pt.tag.id} href={`/tags/${pt.tag.slug}`} className="tag">{pt.tag.name}</a>
              ))}
            </div>
          )}
        </header>
        <MobileTOC content={post.content} />
        <MarkdownRenderer content={post.content} />
        <PostNav prev={prevPost} next={nextPost} />
        <GiscusComments />
      </div>

      {/* 右侧大纲 */}
      <ArticleOutline content={post.content} />
    </div>
  );
}
