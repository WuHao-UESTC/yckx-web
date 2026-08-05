import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

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

  const copy = HOME_CHAPTER_COPY.knowledge;

  return (
    <InteriorPage
      theme="knowledge"
      depth={copy.depth}
      section="标签聚合"
      title={`#${tag.name}`}
      description="沿同一个信号标记，查看散落在不同知识方向中的记录。"
      contentWidth="reading"
    >
      <InteriorSectionHeading title="关联记录" meta={`${posts.length} 篇文章`} />
      {posts.length === 0 ? (
        <InteriorEmpty>这个标签下还没有公开文章。</InteriorEmpty>
      ) : (
        <div className="post-signal-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} showExcerpt={false} />
          ))}
        </div>
      )}
    </InteriorPage>
  );
}
