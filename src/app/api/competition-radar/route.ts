import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { competitionRadarQuerySchema } from "@/modules/home/home.schemas";
import { routeErrorResponse } from "@/server/http/response";

export async function GET(req: NextRequest) {
  try {
    const query = competitionRadarQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const category = query.slug
      ? await prisma.category.findFirst({
          where: { slug: query.slug, type: "COMPETITION" },
          select: { id: true },
        })
      : null;

    if (query.slug && !category) {
      return Response.json({ items: [], nextCursor: null, hasMore: false, total: 0 });
    }

    const where = {
      status: "PUBLISHED" as const,
      category: { type: "COMPETITION" as const },
      ...(category ? { categoryId: category.id } : { isFeatured: true }),
    };
    const [records, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          category: { select: { name: true, slug: true } },
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
      publishedAt: post.publishedAt?.toISOString() ?? null,
      categoryName: post.category?.name ?? "竞赛记录",
      categorySlug: post.category?.slug ?? "uncategorized",
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
