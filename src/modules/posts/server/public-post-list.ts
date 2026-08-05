import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { postListSelect } from "./post-selects";

export type PublicPostSort = "published" | "title";

const pinyinCollator = new Intl.Collator("zh-CN-u-co-pinyin", {
  sensitivity: "base",
  numeric: true,
});

export function comparePinyinTitles(left: string, right: string) {
  return pinyinCollator.compare(left, right);
}

export function parsePublicPostQuery(query: { q?: string; sort?: string; page?: string }) {
  return {
    q: query.q?.trim().slice(0, 100) ?? "",
    sort: query.sort === "title" ? ("title" as const) : ("published" as const),
    page: Math.max(1, Number(query.page) || 1),
  };
}

export async function findPublicPostPage({
  scope,
  q,
  sort,
  page,
}: {
  scope: Prisma.PostWhereInput;
  q: string;
  sort: PublicPostSort;
  page: number;
}) {
  const where: Prisma.PostWhereInput = {
    ...scope,
    status: "PUBLISHED",
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const posts = await prisma.post.findMany({
    where,
    select: postListSelect,
  });

  posts.sort((left, right) => {
    if (sort === "title") return comparePinyinTitles(left.title, right.title);
    const leftTime = (left.publishedAt ?? left.createdAt).getTime();
    const rightTime = (right.publishedAt ?? right.createdAt).getTime();
    return rightTime - leftTime;
  });

  const total = posts.length;
  const start = (page - 1) * POSTS_PER_PAGE;
  return {
    posts: posts.slice(start, start + POSTS_PER_PAGE),
    total,
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

export function publicPostListHref(
  pathname: string,
  query: { q: string; sort: PublicPostSort; page: number }
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort !== "published") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}
