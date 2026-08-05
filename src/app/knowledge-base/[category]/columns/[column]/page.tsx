import { HOME_CHAPTER_COPY } from "@/modules/home/home-copy";
import { TechnicalColumnPage } from "@/modules/posts/components/technical-column-page";

export default async function KnowledgeColumnRoute({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; column: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const { category, column } = await params;
  const query = await searchParams;
  const copy = HOME_CHAPTER_COPY.knowledge;
  return (
    <TechnicalColumnPage
      categorySlug={category}
      columnSlug={column}
      categoryType="KNOWLEDGE"
      theme="knowledge"
      depth={copy.depth}
      section="知识专栏"
      pathname={`/knowledge-base/${category}/columns/${column}`}
      searchParams={query}
    />
  );
}
