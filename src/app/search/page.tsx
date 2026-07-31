import Link from "next/link";

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
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
      ],
    },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  if (posts.length === 0) {
    return <p className="text-[#6b6b6b]">未找到包含 "{query}" 的文章。</p>;
  }

  return (
    <div>
      <p className="text-[#6b6b6b] mb-4 font-[family-name:var(--font-sans)]">找到 {posts.length} 篇相关文章</p>
      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="card group">
            <Link href={`/${post.category?.type === "COMPETITION" ? "competition" : "knowledge-base"}/${post.category?.slug ?? "uncategorized"}/${post.slug}`}>
              <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-[#6b6b6b] line-clamp-2 mt-1 font-[family-name:var(--font-sans)]">
                  {post.excerpt}
                </p>
              )}
              <div className="text-xs text-[#6b6b6b] mt-2 font-[family-name:var(--font-sans)]">
                {post.author.displayName ?? post.author.username} · {post.publishedAt?.toLocaleDateString("zh-CN")}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
