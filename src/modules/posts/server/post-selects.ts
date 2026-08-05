import type { Prisma } from "@/generated/prisma/client";

export const postApiSelect = {
  id: true,
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  coverImage: true,
  status: true,
  postType: true,
  categoryId: true,
  columnId: true,
  viewCount: true,
  isPinned: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  author: {
    select: { id: true, username: true, displayName: true, avatar: true },
  },
  category: true,
  column: true,
  tags: { include: { tag: true } },
  files: {
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  },
} satisfies Prisma.PostSelect;

export const postListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  status: true,
  postType: true,
  viewCount: true,
  isPinned: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  author: {
    select: { id: true, username: true, displayName: true, avatar: true },
  },
  category: true,
  tags: { include: { tag: true } },
} satisfies Prisma.PostSelect;

export const articleDetailSelect = {
  id: true,
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  coverImage: true,
  viewCount: true,
  createdAt: true,
  publishedAt: true,
  categoryId: true,
  author: {
    select: { username: true, displayName: true },
  },
  category: {
    select: { id: true, name: true, slug: true, type: true },
  },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
  files: {
    select: { id: true, filename: true, mimeType: true, size: true },
  },
} satisfies Prisma.PostSelect;

export const adjacentPostSelect = {
  title: true,
  slug: true,
  category: { select: { slug: true, type: true } },
} satisfies Prisma.PostSelect;

export type ArticleDetailData = Prisma.PostGetPayload<{
  select: typeof articleDetailSelect;
}>;

export type AdjacentPostData = Prisma.PostGetPayload<{
  select: typeof adjacentPostSelect;
}>;
