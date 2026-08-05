import type { Metadata } from "next";
import { ArticleDetailPage } from "@/modules/posts/components/article-detail-page";
import { createArticleMetadata } from "@/modules/posts/server/article-queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return createArticleMetadata(slug);
}

export default async function DailyEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArticleDetailPage slug={slug} kind="DAILY" />;
}
