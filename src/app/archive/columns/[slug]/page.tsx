import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ColumnPage({ params }: Props) {
  const { slug } = await params;
  const column = await prisma.column.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
  if (!column) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="mb-2 text-3xl font-bold text-[#1a1a1a]">{column.title}</h1>
      {column.description && (
        <p className="mb-8 font-[family-name:var(--font-sans)] text-[#6b6b6b]">
          {column.description}
        </p>
      )}
      <div className="space-y-4">
        {column.posts.map((post) => (
          <article key={post.id} className="card group">
            <Link href={`/archive/events/${post.slug}`}>
              <h2 className="text-lg font-bold text-[#1a1a1a] transition-colors group-hover:text-[#8b5e3c]">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-1 line-clamp-2 font-[family-name:var(--font-sans)] text-sm text-[#6b6b6b]">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-2 font-[family-name:var(--font-sans)] text-xs text-[#6b6b6b]">
                {post.author.displayName ?? post.author.username} ·{" "}
                {post.publishedAt?.toLocaleDateString("zh-CN")}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
