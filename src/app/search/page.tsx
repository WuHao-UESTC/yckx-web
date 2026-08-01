import { SearchResultCard } from "@/components/search/search-result-card";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-6">搜索</h1>
      <form className="flex gap-3 mb-8">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="搜索文章..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary">搜索</button>
      </form>

      {q ? (
        <SearchResults query={q} />
      ) : (
        <p className="text-[#6b6b6b] font-[family-name:var(--font-sans)]">输入关键词搜索文章。</p>
      )}
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  const { prisma } = await import("@/lib/prisma");

  // PostgreSQL 全文搜索 + ILIKE 回退（中文兼容）
  let posts: Array<{
    slug: string; title: string; excerpt: string | null;
    publishedAt: Date | null; authorUsername: string; authorDisplayName: string | null;
    categoryName: string | null; categorySlug: string | null; categoryType: string | null;
  }> = [];

  try {
    posts = await prisma.$queryRawUnsafe<
      Array<{
        slug: string; title: string; excerpt: string | null;
        publishedAt: Date | null; authorUsername: string; authorDisplayName: string | null;
        categoryName: string | null; categorySlug: string | null; categoryType: string | null;
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
        return <p className="text-[#6b6b6b]">未找到包含 "{query}" 的文章。</p>;
      }

      return (
        <div>
          <p className="text-[#6b6b6b] mb-4 font-[family-name:var(--font-sans)]">找到 {fallback.length} 篇相关文章</p>
          <div className="space-y-4">
            {fallback.map((p) => (
              <SearchResultCard key={p.id} post={{
                slug: p.slug, title: p.title, excerpt: p.excerpt,
                publishedAt: p.publishedAt,
                authorUsername: p.author.username, authorDisplayName: p.author.displayName,
                categoryName: p.category?.name ?? null, categorySlug: p.category?.slug ?? null,
                categoryType: p.category?.type ?? null,
              }} query={query} />
            ))}
          </div>
        </div>
      );
    } catch {
      return <p className="text-[#6b6b6b]">搜索服务暂不可用。</p>;
    }
  }

  return (
    <div>
      <p className="text-[#6b6b6b] mb-4 font-[family-name:var(--font-sans)]">找到 {posts.length} 篇相关文章</p>
      <div className="space-y-4">
        {posts.map((post) => (
          <SearchResultCard key={post.slug} post={post} query={query} />
        ))}
      </div>
    </div>
  );
}
