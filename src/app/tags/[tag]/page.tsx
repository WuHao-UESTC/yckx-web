import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/article/post-card";

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
          <PostCard key={post.id} post={post} showExcerpt={false} />
        ))}
      </div>
    </div>
  );
}
