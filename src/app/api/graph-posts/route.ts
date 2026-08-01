import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** 知识图谱详情面板专用：按分类 slug 获取文章 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("slug");
  const limit = Math.min(Number(searchParams.get("limit")) || 5, 20);

  if (!categorySlug) {
    return NextResponse.json({ posts: [] });
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug }, select: { id: true } });
  if (!category) {
    return NextResponse.json({ posts: [] });
  }

  const posts = await prisma.post.findMany({
    where: { categoryId: category.id, status: "PUBLISHED" },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: { select: { slug: true, type: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ posts });
}
