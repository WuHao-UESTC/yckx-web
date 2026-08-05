import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
  type InteriorTheme,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { PublicPostToolbar } from "./public-post-toolbar";
import {
  findPublicPostPage,
  parsePublicPostQuery,
  publicPostListHref,
} from "../server/public-post-list";

export async function TechnicalColumnPage({
  categorySlug,
  columnSlug,
  categoryType,
  theme,
  depth,
  section,
  pathname,
  searchParams,
}: {
  categorySlug: string;
  columnSlug: string;
  categoryType: "KNOWLEDGE" | "COMPETITION";
  theme: InteriorTheme;
  depth: string;
  section: string;
  pathname: string;
  searchParams: { q?: string; sort?: string; page?: string };
}) {
  const query = parsePublicPostQuery(searchParams);
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug, type: categoryType },
    select: { id: true, name: true },
  });
  if (!category) notFound();
  const column = await prisma.column.findFirst({
    where: { slug: columnSlug, type: "TECHNICAL", categoryId: category.id },
    select: { id: true, title: true, description: true },
  });
  if (!column) notFound();

  const articlePage = await findPublicPostPage({
    scope: {
      kind: "TECHNICAL",
      categoryId: category.id,
      technicalColumns: { some: { columnId: column.id } },
    },
    ...query,
  });

  return (
    <InteriorPage
      theme={theme}
      depth={depth}
      section={`${section} · ${category.name}`}
      title={column.title}
      description={column.description ?? `${category.name}下的专题文章目录`}
      contentWidth="reading"
    >
      <InteriorSectionHeading title="文章列表" meta={`共 ${articlePage.total} 篇文章`} />
      <PublicPostToolbar query={query.q} sort={query.sort} placeholder="搜索当前专栏" />
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
      {articlePage.totalPages > 1 && (
        <nav className="interior-pager" aria-label="专栏文章分页">
          {query.page > 1 && (
            <Link
              href={publicPostListHref(pathname, { ...query, page: query.page - 1 })}
              className="btn-primary"
            >
              上一页
            </Link>
          )}
          {query.page < articlePage.totalPages && (
            <Link
              href={publicPostListHref(pathname, { ...query, page: query.page + 1 })}
              className="btn-primary"
            >
              下一页
            </Link>
          )}
        </nav>
      )}
    </InteriorPage>
  );
}
