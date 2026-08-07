import Link from "next/link";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { ArchiveStarChain } from "@/modules/archive/components/archive-star-chain";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { findMilestones } from "@/modules/milestones/server/milestone-service";
import { PublicPostPager } from "@/modules/posts/components/public-post-pager";
import { PublicPostToolbar } from "@/modules/posts/components/public-post-toolbar";
import { findPublicPostPage, parsePublicPostQuery } from "@/modules/posts/server/public-post-list";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const query = parsePublicPostQuery(await searchParams);
  const [milestones, columns, articlePage] = await Promise.all([
    findMilestones("asc"),
    prisma.column.findMany({
      where: { type: "NEWS", isActive: true },
      include: {
        _count: {
          select: {
            newsPosts: {
              where: {
                post: {
                  status: "PUBLISHED",
                  kind: "NEWS",
                  NOT: { category: { type: "EVENT" } },
                },
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    findPublicPostPage({
      scope: {
        kind: "NEWS",
        NOT: { category: { type: "EVENT" } },
      },
      ...query,
    }),
  ]);
  const copy = HOME_CHAPTER_COPY.archive;

  return (
    <InteriorPage
      theme="archive"
      depth={copy.depth}
      section={copy.label}
      title={copy.title}
      description={copy.description}
      className="archive-page"
    >
      <ArchiveStarChain milestones={milestones} />

      <section className="archive-news-columns" aria-label="新闻专栏">
        <InteriorSectionHeading title="新闻专栏" meta={`${columns.length} 个公开专栏`} />
        {columns.length > 0 ? (
          <nav className="archive-spines" aria-label="新闻专栏">
            {columns.map((column, index) => (
              <Link key={column.id} href={`/archive/columns/${column.slug}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{column.title}</strong>
                <small>{column._count.newsPosts} 篇文章</small>
              </Link>
            ))}
          </nav>
        ) : (
          <InteriorEmpty>暂无公开新闻专栏。</InteriorEmpty>
        )}
      </section>

      <section className="public-post-directory" aria-label="科协新闻">
        <InteriorSectionHeading title="科协新闻" meta={`共 ${articlePage.total} 篇文章`} />
        <PublicPostToolbar query={query.q} sort={query.sort} placeholder="搜索科协新闻" />
        {articlePage.posts.length > 0 ? (
          <div className="post-signal-list">
            {articlePage.posts.map((post) => (
              <PostCard key={post.id} post={post} showTags />
            ))}
          </div>
        ) : (
          <InteriorEmpty>
            {query.q ? `没有找到“${query.q}”相关的新闻。` : "暂无公开新闻。"}
          </InteriorEmpty>
        )}
        <PublicPostPager
          pathname="/archive"
          query={query}
          totalPages={articlePage.totalPages}
          label="科协新闻分页"
        />
      </section>
    </InteriorPage>
  );
}
