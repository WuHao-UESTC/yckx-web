import { notFound } from "next/navigation";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { PublicPostPager } from "@/modules/posts/components/public-post-pager";
import { PublicPostToolbar } from "@/modules/posts/components/public-post-toolbar";
import { findPublicPostPage, parsePublicPostQuery } from "@/modules/posts/server/public-post-list";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}

export default async function DailyColumnPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const query = parsePublicPostQuery(rawQuery);
  const column = await prisma.column.findFirst({
    where: { slug, type: "DAILY", isActive: true },
    select: { id: true, title: true, description: true },
  });
  if (!column) notFound();

  const articlePage = await findPublicPostPage({
    scope: { kind: "DAILY", dailyColumns: { some: { columnId: column.id } } },
    ...query,
  });
  const copy = HOME_CHAPTER_COPY.routine;
  const pathname = `/routine/columns/${slug}`;

  return (
    <InteriorPage
      theme="routine"
      depth={copy.depth}
      section={`${copy.label} · 日常专栏`}
      title={column.title}
      description={column.description ?? "日常专栏文章目录"}
      contentWidth="reading"
    >
      <InteriorSectionHeading title="文章列表" meta={`共 ${articlePage.total} 篇文章`} />
      <PublicPostToolbar query={query.q} sort={query.sort} placeholder="搜索当前日常专栏" />
      {articlePage.posts.length > 0 ? (
        <div className="post-signal-list">
          {articlePage.posts.map((post) => (
            <PostCard key={post.id} post={post} showTags />
          ))}
        </div>
      ) : (
        <InteriorEmpty>
          {query.q ? `没有找到“${query.q}”相关的文章。` : "这个专栏还没有公开文章。"}
        </InteriorEmpty>
      )}
      <PublicPostPager
        pathname={pathname}
        query={query}
        totalPages={articlePage.totalPages}
        label="日常专栏文章分页"
      />
    </InteriorPage>
  );
}
