import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/article/post-card";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CompetitionCategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const category = await prisma.category.findUnique({ where: { slug, type: "COMPETITION" } });
  if (!category) notFound();

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { categoryId: category.id, status: "PUBLISHED" },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where: { categoryId: category.id, status: "PUBLISHED" } }),
  ]);

  const copy = HOME_CHAPTER_COPY.competition;

  return (
    <InteriorPage
      theme="competition"
      depth={copy.depth}
      section={copy.label}
      title={category.name}
      description={copy.title}
      contentWidth="reading"
    >
      <InteriorSectionHeading title="已捕获信号" meta={`共 ${total} 篇 · 第 ${page} 页`} />
      {posts.length === 0 ? (
        <InteriorEmpty>这条航线还没有公开记录。</InteriorEmpty>
      ) : (
        <div className="post-signal-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {total > POSTS_PER_PAGE && (
        <nav className="interior-pager" aria-label="竞赛文章分页">
          {page > 1 && (
            <Link href={`/competition/${slug}?page=${page - 1}`} className="btn-primary">
              上一页
            </Link>
          )}
          {page * POSTS_PER_PAGE < total && (
            <Link href={`/competition/${slug}?page=${page + 1}`} className="btn-primary">
              下一页
            </Link>
          )}
        </nav>
      )}
    </InteriorPage>
  );
}
