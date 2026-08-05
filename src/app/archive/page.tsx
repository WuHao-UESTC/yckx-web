import { CalendarClock, Files, Newspaper } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/article/post-card";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export default async function ArchivePage() {
  const [newsPosts, eventPosts, columns] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", category: { slug: "news" } },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", category: { type: "EVENT" } },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.column.findMany({
      include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const groupedEvents = new Map<number, typeof eventPosts>();

  for (const post of eventPosts) {
    const year = post.createdAt.getFullYear();
    const posts = groupedEvents.get(year) ?? [];
    posts.push(post);
    groupedEvents.set(year, posts);
  }

  const eventYears = [...groupedEvents.keys()].sort((left, right) => right - left);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-8 border-b border-[#d7e4ea] pb-5">
        <div className="mb-2 flex items-center gap-2 text-[#0b6d9b]">
          <Files size={20} aria-hidden="true" />
          <span className="font-[family-name:var(--font-mono)] text-xs">YCKX ARCHIVE</span>
        </div>
        <h1 className="m-0 text-3xl font-bold text-[#071d34]">新闻与大事记</h1>
        <p className="mt-2 text-sm text-[#60788d]">在同一处查阅科协新闻、工作记录与专题归档。</p>
      </header>

      {columns.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-3" aria-label="大事记专栏">
          {columns.map((column) => (
            <Link key={column.id} href={`/archive/columns/${column.slug}`} className="btn-primary">
              {column.title} ({column._count.posts})
            </Link>
          ))}
        </nav>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="archive-news-title">
          <div className="mb-5 flex items-center gap-2 text-[#071d34]">
            <Newspaper size={20} aria-hidden="true" />
            <h2 id="archive-news-title" className="m-0 text-2xl">
              科协新闻
            </h2>
          </div>
          <div className="space-y-3">
            {newsPosts.map((post) => (
              <PostCard key={post.id} post={post} showTags />
            ))}
            {newsPosts.length === 0 && (
              <p className="rounded-md border border-dashed border-[#b9d1dc] px-5 py-10 text-center text-sm text-[#60788d]">
                暂无公开新闻稿。
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="archive-events-title">
          <div className="mb-5 flex items-center gap-2 text-[#071d34]">
            <CalendarClock size={20} aria-hidden="true" />
            <h2 id="archive-events-title" className="m-0 text-2xl">
              大事记
            </h2>
          </div>
          {eventYears.length > 1 && (
            <nav
              className="mb-6 flex flex-wrap gap-2 font-[family-name:var(--font-sans)]"
              aria-label="按年份浏览大事记"
            >
              {eventYears.map((year) => (
                <a
                  key={year}
                  href={`#year-${year}`}
                  className="rounded-full border border-[#d7e4ea] px-3 py-1 text-sm text-[#60788d] transition-colors hover:border-[#7bc9df] hover:bg-[#e3f1f4] hover:text-[#0b6d9b]"
                >
                  {year}
                </a>
              ))}
            </nav>
          )}
          {eventYears.map((year) => (
            <section key={year} id={`year-${year}`} className="mb-8 scroll-mt-20">
              <h3 className="sticky top-16 z-10 mb-4 bg-[#f4f8fb] py-2 text-xl text-[#071d34]">
                {year}
              </h3>
              <div className="relative ml-3 space-y-5 border-l-2 border-[#d7e4ea] pl-6">
                {groupedEvents.get(year)?.map((post) => (
                  <article key={post.id} className="relative">
                    <span
                      className="absolute -left-[29px] top-2 h-3 w-3 rounded-full bg-[#0b6d9b]"
                      aria-hidden="true"
                    />
                    <Link href={`/archive/events/${post.slug}`} className="card group block">
                      <time
                        dateTime={post.createdAt.toISOString()}
                        className="font-[family-name:var(--font-sans)] text-xs text-[#60788d]"
                      >
                        {post.createdAt.toLocaleDateString("zh-CN")}
                      </time>
                      <h4 className="mt-1 text-base font-bold text-[#1a1a1a] transition-colors group-hover:text-[#0b6d9b]">
                        {post.title}
                      </h4>
                      {post.excerpt && (
                        <p className="mt-1 line-clamp-2 font-[family-name:var(--font-sans)] text-sm text-[#60788d]">
                          {post.excerpt}
                        </p>
                      )}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {eventPosts.length === 0 && (
            <p className="rounded-md border border-dashed border-[#b9d1dc] px-5 py-10 text-center text-sm text-[#60788d]">
              暂无公开大事记文章。
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
