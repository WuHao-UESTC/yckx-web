import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { TechnicalColumnPage } from "@/modules/posts/components/technical-column-page";

export default async function CompetitionColumnRoute({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; column: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const { category, column } = await params;
  const query = await searchParams;
  const copy = HOME_CHAPTER_COPY.competition;
  return (
    <TechnicalColumnPage
      categorySlug={category}
      columnSlug={column}
      categoryType="COMPETITION"
      theme="competition"
      depth={copy.depth}
      section="竞赛专栏"
      pathname={`/competition/${category}/columns/${column}`}
      searchParams={query}
    />
  );
}
