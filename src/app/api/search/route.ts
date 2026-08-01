import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** ⌘K 全局搜索 / 搜索页共用 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  if (!q) return NextResponse.json({ results: [], total: 0 });

  // 尝试 tsvector 全文搜索，失败则回退 contains
  let posts: Array<{
    slug: string; title: string; excerpt: string | null;
    authorUsername: string; authorDisplayName: string | null;
    categoryName: string | null; categorySlug: string | null; categoryType: string | null;
  }> = [];

  try {
    posts = await prisma.$queryRawUnsafe<typeof posts>(
      `SELECT p.slug, p.title, p.excerpt,
              u.username AS "authorUsername", u."displayName" AS "authorDisplayName",
              c.name AS "categoryName", c.slug AS "categorySlug", c.type AS "categoryType"
       FROM posts p
       JOIN users u ON u.id = p."authorId"
       LEFT JOIN categories c ON c.id = p."categoryId"
       WHERE p.status = 'PUBLISHED'
         AND (p.search_vector @@ plainto_tsquery('simple', $1) OR p.title ILIKE $2)
       ORDER BY p."publishedAt" DESC
       LIMIT $3`,
      q, `%${q}%`, limit
    );
  } catch {
    const fallback = await prisma.post.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: q } }, { content: { contains: q } }] },
      select: {
        slug: true, title: true, excerpt: true,
        author: { select: { username: true, displayName: true } },
        category: { select: { name: true, slug: true, type: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    posts = fallback.map((p) => ({
      slug: p.slug, title: p.title, excerpt: p.excerpt,
      authorUsername: p.author.username, authorDisplayName: p.author.displayName,
      categoryName: p.category?.name ?? null, categorySlug: p.category?.slug ?? null, categoryType: p.category?.type ?? null,
    }));
  }

  return NextResponse.json({ results: posts, total: posts.length });
}
