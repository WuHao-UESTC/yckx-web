import Link from "next/link";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export const revalidate = 300;

export default async function ArchivePage() {
  const [newsPosts, eventPosts, columns] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        kind: "NEWS",
        NOT: { category: { type: "EVENT" } },
      },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", kind: "NEWS", category: { type: "EVENT" } },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.column.findMany({
      where: { type: "NEWS", isActive: true },
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

  const copy = HOME_CHAPTER_COPY.archive;

  return (
    <InteriorPage
      theme="archive"
      depth={copy.depth}
      section={copy.label}
      title={copy.title}
      description={copy.description}
    >
      {columns.length > 0 && (
        <nav className="archive-spines" aria-label="大事记专栏">
          {columns.map((column, index) => (
            <Link key={column.id} href={`/archive/columns/${column.slug}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{column.title}</strong>
              <small>{column._count.posts} 篇</small>
            </Link>
          ))}
        </nav>
      )}

      <div className="archive-ledger">
        <section aria-label="科协新闻">
          <InteriorSectionHeading title="科协新闻" meta={`${newsPosts.length} 份公开档案`} />
          <div className="post-signal-list">
            {newsPosts.map((post) => (
              <PostCard key={post.id} post={post} showTags />
            ))}
            {newsPosts.length === 0 && <InteriorEmpty>暂无公开新闻稿。</InteriorEmpty>}
          </div>
        </section>

        <section aria-label="大事记">
          <InteriorSectionHeading title="大事记" meta={`${eventPosts.length} 个时间坐标`} />
          {eventYears.length > 1 && (
            <nav className="archive-year-index" aria-label="按年份浏览大事记">
              {eventYears.map((year) => (
                <a key={year} href={`#year-${year}`}>
                  {year}
                </a>
              ))}
            </nav>
          )}
          {eventYears.map((year) => (
            <section key={year} id={`year-${year}`} className="archive-year-block">
              <h3>{year}</h3>
              <div className="archive-timeline">
                {groupedEvents.get(year)?.map((post) => (
                  <article key={post.id} className="archive-event">
                    <span className="archive-event__echo" aria-hidden="true" />
                    <Link href={`/archive/events/${post.slug}`}>
                      <time dateTime={post.createdAt.toISOString()}>
                        {post.createdAt.toLocaleDateString("zh-CN")}
                      </time>
                      <h4>{post.title}</h4>
                      {post.excerpt && <p>{post.excerpt}</p>}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {eventPosts.length === 0 && <InteriorEmpty>暂无公开大事记文章。</InteriorEmpty>}
        </section>
      </div>
    </InteriorPage>
  );
}
