import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { graphPostsQuerySchema } from "@/modules/home/home.schemas";
import { routeErrorResponse } from "@/server/http/response";

export async function GET(req: NextRequest) {
  try {
    const query = graphPostsQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const category = await prisma.category.findFirst({
      where: { slug: query.slug, type: "KNOWLEDGE" },
      select: { id: true },
    });

    if (!category) {
      return Response.json({ items: [], nextCursor: null, hasMore: false, total: 0 });
    }

    const where = {
      categoryId: category.id,
      status: "PUBLISHED" as const,
    };
    const [records, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          author: { select: { username: true, displayName: true } },
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      }),
      prisma.post.count({ where }),
    ]);

    const hasMore = records.length > query.limit;
    const items = records.slice(0, query.limit).map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      authorName: post.author.displayName ?? post.author.username,
    }));

    return Response.json({
      items,
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
      hasMore,
      total,
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
