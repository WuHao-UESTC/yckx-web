import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainIndexItem } from "@/components/interior/domain-index-item";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { PublicPostToolbar } from "@/modules/posts/components/public-post-toolbar";
import {
  findPublicPostPage,
  parsePublicPostQuery,
  publicPostListHref,
} from "@/modules/posts/server/public-post-list";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}

export default async function KnowledgeCategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const query = parsePublicPostQuery(await searchParams);
  const category = await prisma.category.findUnique({ where: { slug, type: "KNOWLEDGE" } });
  if (!category) notFound();

  const [columns, articlePage] = await Promise.all([
    prisma.column.findMany({
      where: { type: "TECHNICAL", categoryId: category.id, isActive: true },
      include: {
        _count: {
          select: { technicalPosts: { where: { post: { status: "PUBLISHED" } } } },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    findPublicPostPage({
      scope: { categoryId: category.id, kind: "TECHNICAL" },
      ...query,
    }),
  ]);
  const copy = HOME_CHAPTER_COPY.knowledge;
  const pathname = `/knowledge-base/${slug}`;

  return (
    <InteriorPage
      theme="knowledge"
      depth={copy.depth}
      section={copy.label}
      title={category.name}
      description={copy.title}
      contentWidth="reading"
    >
      {columns.length > 0 && (
        <section className="technical-column-directory">
          <InteriorSectionHeading title="专栏" meta={`${columns.length} 个专题入口`} />
          <div className="domain-index domain-index--columns">
            {columns.map((column, index) => (
              <DomainIndexItem
                key={column.id}
                href={`${pathname}/columns/${column.slug}`}
                index={index}
                title={column.title}
                description={column.description}
                count={column._count.technicalPosts}
                countLabel="篇文章"
              />
            ))}
          </div>
        </section>
      )}

      <section className="public-post-directory">
        <InteriorSectionHeading title="文章列表" meta={`共 ${articlePage.total} 篇文章`} />
        <PublicPostToolbar query={query.q} sort={query.sort} placeholder="搜索当前知识分类" />
        {articlePage.posts.length === 0 ? (
          <InteriorEmpty>
            {query.q ? `没有找到“${query.q}”相关的文章。` : "这个分类还没有公开文章。"}
          </InteriorEmpty>
        ) : (
          <div className="post-signal-list">
            {articlePage.posts.map((post) => (
              <PostCard key={post.id} post={post} showTags />
            ))}
          </div>
        )}

        {articlePage.totalPages > 1 && (
          <nav className="interior-pager" aria-label="知识文章分页">
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
      </section>
    </InteriorPage>
  );
}
