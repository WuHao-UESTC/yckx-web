import { notFound } from "next/navigation";
import Link from "next/link";
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
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">{column.title}</h1>
      {column.description && (
        <p className="text-[#6b6b6b] mb-8 font-[family-name:var(--font-sans)]">
          {column.description}
        </p>
      )}
      <div className="space-y-4">
        {column.posts.map((post) => (
          <article key={post.id} className="card group">
            <Link href={`/events/${post.slug}`}>
              <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-[#8b5e3c] transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-[#6b6b6b] line-clamp-2 mt-1 font-[family-name:var(--font-sans)]">
                  {post.excerpt}
                </p>
              )}
              <div className="text-xs text-[#6b6b6b] mt-2 font-[family-name:var(--font-sans)]">
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
