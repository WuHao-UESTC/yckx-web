import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/article/post-card";

async function getHomeData() {
  const [featuredPosts, latestPosts, recentPhotos, recentEvents] = await Promise.all([
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
    prisma.post.findMany({
      where: { status: "PUBLISHED", category: { type: "EVENT" } },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { featuredPosts, latestPosts, recentPhotos, recentEvents };
}

export default async function Home() {
  const { featuredPosts, latestPosts, recentPhotos, recentEvents } = await getHomeData();

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

      {/* 大事记预览 */}
      {recentEvents.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5 pb-2 border-b border-[#e8e0d5]">
            <h2 className="text-xl font-bold text-[#1a1a1a]">大事记</h2>
            <Link
              href="/events"
              className="text-sm text-[#8b5e3c] hover:text-[#5a3a22] font-[family-name:var(--font-sans)]"
            >
              查看全部 →
            </Link>
          </div>
          <div className="relative border-l-2 border-[#e8e0d5] ml-3 pl-6 space-y-4">
            {recentEvents.map((post) => (
              <div key={post.id} className="relative">
                <span className="absolute -left-[29px] top-1.5 w-3 h-3 bg-[#c4a882] rounded-full" />
                <Link href={`/events/${post.slug}`} className="block card group">
                  <time className="text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
                    {post.createdAt.toLocaleDateString("zh-CN")}
                  </time>
                  <h3 className="text-base font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors mt-1">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-[#6b6b6b] line-clamp-2 mt-1 font-[family-name:var(--font-sans)]">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

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
