import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { POSTS_PER_PAGE } from "@/lib/constants";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CompetitionCategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const category = await prisma.category.findUnique({ where: { slug, type: "COMPETITION" } });
  if (!category) notFound();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { categoryId: category.id, status: "PUBLISHED" },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where: { categoryId: category.id, status: "PUBLISHED" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">{category.name}</h1>
      <p className="text-[#6b6b6b] mb-8 font-[family-name:var(--font-sans)]">共 {total} 篇文章</p>
      {posts.length === 0 ? (
        <p className="text-[#6b6b6b]">该分类暂无文章。</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="card group">
              <Link href={`/competition/${slug}/${post.slug}`}>
                <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-[#6b6b6b] line-clamp-2 mt-1 font-[family-name:var(--font-sans)]">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-[#6b6b6b] mt-2 font-[family-name:var(--font-sans)]">
                  <span>{post.author.displayName ?? post.author.username}</span>
                  <span>·</span>
                  <time>{post.publishedAt?.toLocaleDateString("zh-CN")}</time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
