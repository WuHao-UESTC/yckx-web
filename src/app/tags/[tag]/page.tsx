import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: Props) {
  const { tag: slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) notFound();

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", tags: { some: { tag: { slug } } } },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">#{tag.name}</h1>
      <p className="text-[#6b6b6b] mb-8 font-[family-name:var(--font-sans)]">{posts.length} 篇文章</p>
      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="card group">
            <Link href={`/${post.category?.type === "COMPETITION" ? "competition" : "knowledge-base"}/${post.category?.slug ?? "uncategorized"}/${post.slug}`}>
              <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors">{post.title}</h3>
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
