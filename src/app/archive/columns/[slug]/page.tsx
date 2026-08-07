import { notFound } from "next/navigation";
import { Suspense } from "react";
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

function ColumnLoading() {
  return <div className="interior-empty">正在读取新闻专栏…</div>;
}

async function ColumnContent({ params, searchParams }: Props) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const query = parsePublicPostQuery(rawQuery);
  const column = await prisma.column.findFirst({
    where: { slug, type: "NEWS", isActive: true },
    select: { id: true, title: true, description: true },
  });
  if (!column) notFound();

  const articlePage = await findPublicPostPage({
    scope: {
      kind: "NEWS",
      NOT: { category: { type: "EVENT" } },
      newsColumns: { some: { columnId: column.id } },
    },
    ...query,
  });
  const copy = HOME_CHAPTER_COPY.archive;
  const pathname = `/archive/columns/${slug}`;

  return (
    <InteriorPage
      theme="archive"
      depth={copy.depth}
      section={`${copy.label} · 新闻专栏`}
      title={column.title}
      description={column.description ?? "新闻专栏文章目录"}
      contentWidth="reading"
      className="archive-column-page"
    >
      <InteriorSectionHeading title="文章列表" meta={`共 ${articlePage.total} 篇文章`} />
      <PublicPostToolbar query={query.q} sort={query.sort} placeholder="搜索当前新闻专栏" />
      {articlePage.posts.length > 0 ? (
        <div className="post-signal-list">
          {articlePage.posts.map((post) => (
            <PostCard key={post.id} post={post} showTags />
          ))}
        </div>
      ) : (
        <InteriorEmpty>
          {query.q ? `没有找到“${query.q}”相关的新闻。` : "这个专栏还没有公开文章。"}
        </InteriorEmpty>
      )}
      <PublicPostPager
        pathname={pathname}
        query={query}
        totalPages={articlePage.totalPages}
        label="新闻专栏文章分页"
      />
    </InteriorPage>
  );
}

export default function ColumnPage(props: Props) {
  return (
    <Suspense fallback={<ColumnLoading />}>
      <ColumnContent {...props} />
    </Suspense>
  );
}
