import { DomainIndexItem } from "@/components/interior/domain-index-item";
import {
  InteriorEmpty,
  InteriorPage,
  InteriorSectionHeading,
} from "@/components/interior/interior-page";
import { prisma } from "@/lib/prisma";
import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";

export const revalidate = 300;

export default async function CompetitionPage() {
  const categories = await prisma.category.findMany({
    where: { type: "COMPETITION", isActive: true },
    include: {
      _count: { select: { posts: { where: { status: "PUBLISHED", kind: "TECHNICAL" } } } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const copy = HOME_CHAPTER_COPY.competition;

  return (
    <InteriorPage
      theme="competition"
      depth={copy.depth}
      section={copy.label}
      title={copy.title}
      description={copy.description}
    >
      <InteriorSectionHeading title="声纳目标" meta={`${categories.length} 条竞赛航线`} />
      {categories.length === 0 ? (
        <InteriorEmpty>新的竞赛航线即将出现。</InteriorEmpty>
      ) : (
        <div className="domain-index domain-index--sonar">
          {categories.map((category, index) => (
            <DomainIndexItem
              key={category.id}
              href={`/competition/${category.slug}`}
              index={index}
              title={category.name}
              count={category._count.posts}
              countLabel="篇信号"
            />
          ))}
        </div>
      )}
    </InteriorPage>
  );
}
