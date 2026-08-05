import { DomainIndexItem } from "@/components/interior/domain-index-item";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export const revalidate = 300;

export default async function KnowledgeBasePage() {
  const categories = await prisma.category.findMany({
    where: { type: "KNOWLEDGE" },
    include: { _count: { select: { posts: { where: { status: "PUBLISHED" } } } } },
    orderBy: { sortOrder: "asc" },
  });

  const copy = HOME_CHAPTER_COPY.knowledge;

  return (
    <InteriorPage
      theme="knowledge"
      depth={copy.depth}
      section={copy.label}
      title={copy.title}
      description={copy.description}
    >
      <InteriorSectionHeading title="潮汐分类" meta={`${categories.length} 个知识方向`} />
      {categories.length === 0 ? (
        <InteriorEmpty>新的知识光点仍在等待接入。</InteriorEmpty>
      ) : (
        <div className="domain-index">
          {categories.map((category, index) => (
            <DomainIndexItem
              key={category.id}
              href={`/knowledge-base/${category.slug}`}
              index={index}
              title={category.name}
              count={category._count.posts}
            />
          ))}
        </div>
      )}
    </InteriorPage>
  );
}
