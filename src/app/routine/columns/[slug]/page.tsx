import { notFound } from "next/navigation";
import { PostCard } from "@/components/article/post-card";
import { InteriorEmpty, InteriorPage } from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export default async function DailyColumnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const column = await prisma.column.findFirst({
    where: { slug, type: "DAILY" },
    include: {
      posts: {
        where: { status: "PUBLISHED", kind: "DAILY" },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          category: true,
          column: true,
          tags: { include: { tag: true } },
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
  if (!column) notFound();
  const copy = HOME_CHAPTER_COPY.routine;

  return (
    <InteriorPage
      theme="routine"
      depth={copy.depth}
      section={`${copy.label} · 日常专栏`}
      title={column.title}
      description={column.description ?? copy.description}
      contentWidth="reading"
    >
      <div className="post-signal-list">
        {column.posts.map((post) => (
          <PostCard key={post.id} post={post} showTags />
        ))}
        {column.posts.length === 0 && <InteriorEmpty>这个日常专栏还没有公开文章。</InteriorEmpty>}
      </div>
    </InteriorPage>
  );
}
