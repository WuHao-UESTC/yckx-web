import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { InteriorEmpty, InteriorPage } from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

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
  const copy = HOME_CHAPTER_COPY.archive;

  return (
    <InteriorPage
      theme="archive"
      depth={copy.depth}
      section={`${copy.label} · 专栏`}
      title={column.title}
      description={column.description ?? copy.description}
      contentWidth="reading"
      className="archive-column-page"
    >
      <div className="archive-column-register" aria-label={`${column.title}文章目录`}>
        {column.posts.map((post) => (
          <article key={post.id}>
            <Link href={`/archive/events/${post.slug}`}>
              <time dateTime={post.publishedAt?.toISOString()}>
                {post.publishedAt?.toLocaleDateString("zh-CN") ?? "未标注日期"}
              </time>
              <div>
                <h2>{post.title}</h2>
                {post.excerpt && <p>{post.excerpt}</p>}
                <small>{post.author.displayName ?? post.author.username}</small>
              </div>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </article>
        ))}
        {column.posts.length === 0 && <InteriorEmpty>这个专栏还没有公开档案。</InteriorEmpty>}
      </div>
    </InteriorPage>
  );
}
