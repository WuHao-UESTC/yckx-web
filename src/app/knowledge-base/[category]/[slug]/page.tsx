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
  if (!post) return { title: "文章未找到" };
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

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatar: true } },
      category: true,
      tags: { include: { tag: true } },
      files: true,
      _count: { select: { comments: true } },
    },
  });

  if (!post) notFound();

  // 阅读量+1（异步，不阻塞渲染）
  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // 查询上/下篇（同分类，按发布时间）
  const [prevPost, nextPost] = await Promise.all([
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            status: "PUBLISHED",
            categoryId: post.categoryId,
            publishedAt: { lt: post.publishedAt },
          },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
            category: true,
          },
          orderBy: { publishedAt: "desc" },
        })
      : null,
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            status: "PUBLISHED",
            categoryId: post.categoryId,
            publishedAt: { gt: post.publishedAt },
          },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
            category: true,
          },
          orderBy: { publishedAt: "asc" },
        })
      : null,
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 flex justify-center gap-10">
      {/* 正文区域 */}
      <div className="min-w-0 max-w-3xl flex-1">
        {/* 文章头 */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
            <span>{post.author.displayName ?? post.author.username}</span>
            <span>·</span>
            <time>{post.publishedAt?.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</time>
            <span>·</span>
            <span>{post.viewCount} 次阅读</span>
            {post.category && (
              <>
                <span>·</span>
                <span className="tag">{post.category.name}</span>
              </>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map((pt) => (
                <a key={pt.tag.id} href={`/tags/${pt.tag.slug}`} className="tag">
                  {pt.tag.name}
                </a>
              ))}
            </div>
          )}
        </header>

        {/* 封面图 */}
        {post.coverImage && (
          <div className="mb-6 rounded-md overflow-hidden bg-[#f5f0e8]">
            <img src={post.coverImage} alt={post.title}
              className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        {/* 移动端折叠目录 */}
        <MobileTOC content={post.content} />

        {/* 正文 */}
        <MarkdownRenderer content={post.content} />

        {/* 附件 */}
        {post.files.length > 0 && (
          <div className="mt-8 p-4 bg-[#faf7f2] rounded-md border border-[#e8e0d5]">
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-2 font-[family-name:var(--font-sans)]">
              附件下载
            </h3>
            <ul className="space-y-1">
              {post.files.map((f) => (
                <li key={f.id}>
                  <a
                    href={`/api/files/${f.id}`}
                    className="text-sm text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
                  >
                    {f.filename} ({(f.size / 1024).toFixed(0)} KB)
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 上/下篇导航 */}
        <PostNav prev={prevPost} next={nextPost} />

        {/* 评论区 */}
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
