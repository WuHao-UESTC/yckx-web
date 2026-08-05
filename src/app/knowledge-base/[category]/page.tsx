import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { PostCard } from "@/components/article/post-card";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function KnowledgeCategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const category = await prisma.category.findUnique({
    where: { slug, type: "KNOWLEDGE" },
  });
  if (!category) notFound();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { categoryId: category.id, status: "PUBLISHED" },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
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
            <PostCard key={post.id} post={post} showTags />
          ))}
        </div>
      )}

      {total > POSTS_PER_PAGE && (
        <div className="flex justify-center gap-4 mt-8 font-[family-name:var(--font-sans)]">
          {page > 1 && (
            <Link href={`/knowledge-base/${slug}?page=${page - 1}`} className="btn-primary">
              ← 上一页
            </Link>
          )}
          {page * POSTS_PER_PAGE < total && (
            <Link href={`/knowledge-base/${slug}?page=${page + 1}`} className="btn-primary">
              下一页 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
