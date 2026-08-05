import type { Metadata } from "next";
import { ArticleDetailPage } from "@/modules/posts/components/article-detail-page";
import { createArticleMetadata } from "@/modules/posts/server/article-queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return createArticleMetadata(slug);
}

export default async function EventArticlePage({ params }: Props) {
  const { slug } = await params;
  return <ArticleDetailPage slug={slug} kind="EVENT" />;
}
