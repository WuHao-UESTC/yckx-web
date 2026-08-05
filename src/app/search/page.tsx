import { SearchResultCard } from "@/components/search/search-result-card";
import { InteriorEmpty, InteriorPage } from "@/components/interior/interior-page";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const copy = HOME_CHAPTER_COPY.knowledge;

  return (
    <InteriorPage
      theme="knowledge"
      depth={copy.depth}
      section="信号检索"
      title="沿知识潮汐追踪一个关键词。"
      description={copy.title}
      contentWidth="reading"
    >
      <form className="interior-search-form">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="搜索文章..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary">
          搜索
        </button>
      </form>

      {q ? (
        <SearchResults query={q} />
      ) : (
        <InteriorEmpty>输入关键词，开始追踪站内内容。</InteriorEmpty>
      )}
    </InteriorPage>
  );
}

async function SearchResults({ query }: { query: string }) {
  const { prisma } = await import("@/lib/prisma");

  // PostgreSQL 全文搜索 + ILIKE 回退（中文兼容）
  let posts: Array<{
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    authorUsername: string;
    authorDisplayName: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    categoryType: string | null;
  }> = [];

  try {
    posts = await prisma.$queryRawUnsafe<
      Array<{
        slug: string;
        title: string;
        excerpt: string | null;
        publishedAt: Date | null;
        authorUsername: string;
        authorDisplayName: string | null;
        categoryName: string | null;
        categorySlug: string | null;
        categoryType: string | null;
      }>
    >(
      `SELECT p.slug, p.title, p.excerpt, p."publishedAt",
              u.username AS "authorUsername", u."displayName" AS "authorDisplayName",
              c.name AS "categoryName", c.slug AS "categorySlug", c.type AS "categoryType"
       FROM posts p
       JOIN users u ON u.id = p."authorId"
       LEFT JOIN categories c ON c.id = p."categoryId"
       WHERE p.status = 'PUBLISHED'
         AND (
           p.search_vector @@ plainto_tsquery('simple', $1)
           OR p.title ILIKE $2
           OR p.content ILIKE $2
         )
       ORDER BY p."publishedAt" DESC
       LIMIT 20`,
      query,
      `%${query}%`
    );
  } catch {
    // tsvector 列不存在 → 回退 contains
  }

  if (posts.length === 0) {
    try {
      const fallback = await prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ title: { contains: query } }, { content: { contains: query } }],
        },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          category: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      });

      if (fallback.length === 0) {
        return <InteriorEmpty>未找到包含“{query}”的文章。</InteriorEmpty>;
      }

      return (
        <div>
          <p className="interior-result-count">找到 {fallback.length} 篇相关文章</p>
          <div className="post-signal-list">
            {fallback.map((p) => (
              <SearchResultCard
                key={p.id}
                post={{
                  slug: p.slug,
                  title: p.title,
                  excerpt: p.excerpt,
                  publishedAt: p.publishedAt,
                  authorUsername: p.author.username,
                  authorDisplayName: p.author.displayName,
                  categoryName: p.category?.name ?? null,
                  categorySlug: p.category?.slug ?? null,
                  categoryType: p.category?.type ?? null,
                }}
                query={query}
              />
            ))}
          </div>
        </div>
      );
    } catch {
      return <InteriorEmpty>搜索服务暂不可用。</InteriorEmpty>;
    }
  }

  return (
    <div>
      <p className="interior-result-count">找到 {posts.length} 篇相关文章</p>
      <div className="post-signal-list">
        {posts.map((post) => (
          <SearchResultCard key={post.slug} post={post} query={query} />
        ))}
      </div>
    </div>
  );
}
