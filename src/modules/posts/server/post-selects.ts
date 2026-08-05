import type { Prisma } from "@/generated/prisma/client";

export const postApiSelect = {
  id: true,
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  coverImage: true,
  status: true,
  kind: true,
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
  category: {
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  },
  column: {
    select: { id: true, title: true, slug: true, type: true, isActive: true },
  },
  tags: { include: { tag: true } },
  files: {
    orderBy: { sortOrder: "asc" },
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
  kind: true,
  viewCount: true,
  isPinned: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  author: {
    select: { id: true, username: true, displayName: true, avatar: true },
  },
  category: { select: { id: true, name: true, slug: true, type: true } },
  column: { select: { id: true, title: true, slug: true, type: true } },
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
  kind: true,
  categoryId: true,
  author: {
    select: { username: true, displayName: true },
  },
  category: {
    select: { id: true, name: true, slug: true, type: true },
  },
  column: {
    select: { id: true, title: true, slug: true, type: true },
  },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
  files: {
    orderBy: { sortOrder: "asc" },
    select: { id: true, filename: true, mimeType: true, size: true },
  },
} satisfies Prisma.PostSelect;

export const adjacentPostSelect = {
  title: true,
  slug: true,
  kind: true,
  category: { select: { slug: true, type: true } },
  column: { select: { slug: true, type: true } },
} satisfies Prisma.PostSelect;

export type ArticleDetailData = Prisma.PostGetPayload<{
  select: typeof articleDetailSelect;
}>;

export type AdjacentPostData = Prisma.PostGetPayload<{
  select: typeof adjacentPostSelect;
}>;
