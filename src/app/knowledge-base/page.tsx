import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function KnowledgeBasePage() {
  const categories = await prisma.category.findMany({
    where: { type: "KNOWLEDGE" },
    include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">知识库</h1>
      <p className="text-[#6b6b6b] mb-8 font-[family-name:var(--font-sans)]">
        按分类浏览技术文章
      </p>

      {categories.length === 0 ? (
        <p className="text-[#6b6b6b]">暂无分类。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/knowledge-base/${cat.slug}`}
              className="card group"
            >
              <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors">
                {cat.name}
              </h3>
              <p className="text-sm text-[#6b6b6b] mt-1 font-[family-name:var(--font-sans)]">
                {cat._count.posts} 篇文章
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
