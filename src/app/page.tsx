import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { PostWithAuthor } from "@/types";

async function getHomeData() {
  const [featuredPosts, latestPosts, recentPhotos] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
    prisma.photo.findMany({
      include: {
        author: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return { featuredPosts, latestPosts, recentPhotos };
}

function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <article className="card group">
      <Link href={`/${post.category?.type === "COMPETITION" ? "competition" : "knowledge-base"}/${post.category?.slug ?? "uncategorized"}/${post.slug}`}>
        <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors mb-2 leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-[#6b6b6b] line-clamp-2 mb-3 leading-relaxed font-[family-name:var(--font-sans)]">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          <span>{post.author.displayName ?? post.author.username}</span>
          <span>·</span>
          <time dateTime={post.publishedAt?.toISOString()}>
            {post.publishedAt?.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          </time>
          {post.category && (
            <>
              <span>·</span>
              <span className="tag">{post.category.name}</span>
            </>
          )}
        </div>
      </Link>
    </article>
  );
}

export default async function Home() {
  const { featuredPosts, latestPosts, recentPhotos } = await getHomeData();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      {/* Hero Banner */}
      <section className="mb-12 py-10 text-center">
        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-3 tracking-wide">
          英才科协
        </h1>
        <p className="text-lg text-[#6b6b6b] max-w-lg mx-auto leading-relaxed font-[family-name:var(--font-sans)]">
          技术博客 · 竞赛知识库 · 工作日志 · 团队日常
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/knowledge-base" className="btn-primary">知识库</Link>
          <Link href="/competition" className="btn-primary">竞赛</Link>
          <Link href="/events" className="btn-primary">大事记</Link>
        </div>
      </section>

      {/* 置顶文章 */}
      {featuredPosts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-5 pb-2 border-b border-[#e8e0d5]">
            精选文章
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* 最新文章 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-5 pb-2 border-b border-[#e8e0d5]">
          最新文章
        </h2>
        {latestPosts.length === 0 ? (
          <p className="text-[#6b6b6b] text-sm font-[family-name:var(--font-sans)]">还没有文章发布。</p>
        ) : (
          <div className="space-y-4">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* 照片墙预览 */}
      {recentPhotos.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-5 pb-2 border-b border-[#e8e0d5]">
            最近照片
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentPhotos.map((photo) => (
              <div key={photo.id} className="aspect-square rounded-md overflow-hidden bg-[#f5f0e8]">
                <img
                  src={photo.imagePath}
                  alt={photo.caption ?? ""}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <Link
            href="/routine"
            className="inline-block mt-3 text-sm text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
          >
            查看更多照片 →
          </Link>
        </section>
      )}

      {/* 友链入口 */}
      <section className="text-center py-8 border-t border-[#e8e0d5]">
        <p className="text-[#6b6b6b] mb-3 font-[family-name:var(--font-sans)]">
          结识科协成员，查看个人主页
        </p>
        <Link href="/friends" className="btn-primary">
          查看友链
        </Link>
      </section>
    </div>
  );
}
