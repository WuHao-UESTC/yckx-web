import "server-only";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/constants";
import { adjacentPostSelect, articleDetailSelect, type ArticleDetailData } from "./post-selects";

export type ArticleKind = "KNOWLEDGE" | "COMPETITION" | "EVENT";

export async function createArticleMetadata(slug: string): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, excerpt: true, coverImage: true },
  });

  if (!post) return { title: "文章未找到" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
  };
}

export function findPublishedArticle(slug: string) {
  return prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: articleDetailSelect,
  });
}

export async function findAdjacentPosts(post: ArticleDetailData, kind: ArticleKind) {
  const scope =
    kind === "EVENT" ? { category: { type: "EVENT" as const } } : { categoryId: post.categoryId };

  return Promise.all([
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            status: "PUBLISHED",
            ...scope,
            publishedAt: { lt: post.publishedAt },
          },
          select: adjacentPostSelect,
          orderBy: { publishedAt: "desc" },
        })
      : null,
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            status: "PUBLISHED",
            ...scope,
            publishedAt: { gt: post.publishedAt },
          },
          select: adjacentPostSelect,
          orderBy: { publishedAt: "asc" },
        })
      : null,
  ]);
}
