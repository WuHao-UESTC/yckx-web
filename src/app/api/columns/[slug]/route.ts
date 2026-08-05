import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POSTS_PER_PAGE } from "@/lib/constants";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);

  const column = await prisma.column.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
      },
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
  });

  if (!column) {
    return NextResponse.json({ error: "专栏不存在" }, { status: 404 });
  }

  return NextResponse.json(column);
}
