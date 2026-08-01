import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/article/post-card";
import { LazySection } from "@/components/shared/lazy-section";

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

function SectionHeading({ children, href, moreLabel }: { children: React.ReactNode; href?: string; moreLabel?: string }) {
  return (
    <div className="flex items-end justify-between mb-7 pb-3 border-b border-[#e8e0d5]">
      <h2 className="text-xl font-bold text-[#1a1a1a] tracking-wide">{children}</h2>
      {href && (
        <Link
          href={href}
          className="text-xs text-[#8b5e3c] hover:text-[#5a3a22] tracking-wide font-[family-name:var(--font-sans)] pb-0.5 border-b border-transparent hover:border-[#c4a882] transition-colors"
        >
          {moreLabel ?? "查看全部"} →
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const { featuredPosts, latestPosts, recentPhotos, recentEvents } = await getHomeData();

  return (
    <>
      {/* ════════════════════════════════════════════ */}
      {/* Hero — 纸张纹理，全宽，视觉锚点                        */}
      {/* ════════════════════════════════════════════ */}
      <section className="paper-texture border-b border-[#e8e0d5]">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24 text-center">
          {/* 英文装饰 */}
          <p className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-[#c4a882] mb-5 font-[family-name:var(--font-sans)]">
            Yingcai Association of Science &amp; Technology
          </p>

          {/* 主标题 */}
          <h1 className="text-5xl sm:text-6xl font-bold text-[#1a1a1a] mb-5 tracking-wide leading-tight">
            英才科协
          </h1>

          {/* 副标题 */}
          <p className="text-base sm:text-lg text-[#6b6b6b] max-w-lg mx-auto leading-relaxed font-[family-name:var(--font-sans)]">
            一群热爱技术的年轻人。在这里写博客、整竞赛、记日常、交朋友。
          </p>

          {/* 快捷入口 */}
          <div className="mt-9 flex justify-center gap-3 flex-wrap">
            <Link href="/knowledge-base" className="btn-primary text-sm px-5 py-2.5">
              知识库
            </Link>
            <Link href="/competition" className="btn-primary text-sm px-5 py-2.5">
              竞赛
            </Link>
            <Link href="/events" className="btn-primary text-sm px-5 py-2.5">
              大事记
            </Link>
            <Link href="/routine" className="btn-primary text-sm px-5 py-2.5">
              科协日常
            </Link>
          </div>

          {/* 向下滚动提示 */}
          <p className="mt-12 text-xs text-[#c4a882] animate-bounce font-[family-name:var(--font-sans)]">
            ↓
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* 内容区                                         */}
      {/* ════════════════════════════════════════════ */}
      <div className="mx-auto max-w-4xl px-5 py-10 space-y-10">

        {/* ── 精选文章 ── */}
        {featuredPosts.length > 0 && (
          <section>
            <SectionHeading>精选文章</SectionHeading>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* ── 最新文章 ── */}
        <LazySection>
          <section>
            <SectionHeading href="/knowledge-base" moreLabel="更多文章">最新文章</SectionHeading>
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
        </LazySection>

        {/* ── 大事记预览 ── */}
        {recentEvents.length > 0 && (
          <LazySection>
            <section>
              <SectionHeading href="/events">大事记</SectionHeading>
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
          </LazySection>
        )}

        {/* ── 照片墙预览 ── */}
        {recentPhotos.length > 0 && (
          <LazySection>
            <section>
              <SectionHeading href="/routine" moreLabel="更多照片">最近照片</SectionHeading>
              <div className="columns-2 sm:columns-4 gap-3 space-y-3">
                {recentPhotos.map((photo) => (
                  <div key={photo.id} className="break-inside-avoid rounded-md overflow-hidden bg-[#f5f0e8]">
                    <img
                      src={photo.imagePath}
                      alt={photo.caption ?? ""}
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          </LazySection>
        )}

        {/* ── 友链入口 ── */}
        <LazySection>
          <section className="text-center py-10 border-t border-[#e8e0d5]">
            <p className="text-lg text-[#1a1a1a] font-bold mb-2 tracking-wide">
              科协成员
            </p>
            <p className="text-sm text-[#6b6b6b] mb-5 font-[family-name:var(--font-sans)]">
              结识一起做技术的伙伴
            </p>
            <Link href="/friends" className="btn-primary text-sm px-6 py-2.5">
              查看友链
            </Link>
          </section>
        </LazySection>

      </div>
    </>
  );
}
