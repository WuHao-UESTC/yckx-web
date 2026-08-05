import Link from "next/link";
import { DomainIndexItem } from "@/components/interior/domain-index-item";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { PublicPostToolbar } from "@/modules/posts/components/public-post-toolbar";
import {
  findPublicPostPage,
  parsePublicPostQuery,
  publicPostListHref,
} from "@/modules/posts/server/public-post-list";

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const query = parsePublicPostQuery(await searchParams);
  const [categories, articlePage] = await Promise.all([
    prisma.category.findMany({
      where: { type: "KNOWLEDGE", isActive: true },
      include: {
        _count: { select: { posts: { where: { status: "PUBLISHED", kind: "TECHNICAL" } } } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    findPublicPostPage({
      scope: { kind: "TECHNICAL", category: { type: "KNOWLEDGE" } },
      ...query,
    }),
  ]);
  const copy = HOME_CHAPTER_COPY.knowledge;

  return (
    <InteriorPage
      theme="knowledge"
      depth={copy.depth}
      section={copy.label}
      title={copy.title}
      description={copy.description}
    >
      <InteriorSectionHeading title="知识分类" meta={`${categories.length} 个知识方向`} />
      {categories.length === 0 ? (
        <InteriorEmpty>新的知识光点仍在等待接入。</InteriorEmpty>
      ) : (
        <div className="domain-index">
          {categories.map((category, index) => (
            <DomainIndexItem
              key={category.id}
              href={`/knowledge-base/${category.slug}`}
              index={index}
              title={category.name}
              count={category._count.posts}
              countLabel="篇文章"
            />
          ))}
        </div>
      )}

      <section className="public-post-directory">
        <InteriorSectionHeading title="文章列表" meta={`共 ${articlePage.total} 篇文章`} />
        <PublicPostToolbar query={query.q} sort={query.sort} />
        {articlePage.posts.length > 0 ? (
          <div className="post-signal-list">
            {articlePage.posts.map((post) => (
              <PostCard key={post.id} post={post} showTags />
            ))}
          </div>
        ) : (
          <InteriorEmpty>
            {query.q ? `没有找到“${query.q}”相关的文章。` : "暂无公开文章。"}
          </InteriorEmpty>
        )}
        <Pager pathname="/knowledge-base" query={query} totalPages={articlePage.totalPages} />
      </section>
    </InteriorPage>
  );
}

function Pager({
  pathname,
  query,
  totalPages,
}: {
  pathname: string;
  query: ReturnType<typeof parsePublicPostQuery>;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="interior-pager" aria-label="知识文章分页">
      {query.page > 1 && (
        <Link
          href={publicPostListHref(pathname, { ...query, page: query.page - 1 })}
          className="btn-primary"
        >
          上一页
        </Link>
      )}
      {query.page < totalPages && (
        <Link
          href={publicPostListHref(pathname, { ...query, page: query.page + 1 })}
          className="btn-primary"
        >
          下一页
        </Link>
      )}
    </nav>
  );
}
