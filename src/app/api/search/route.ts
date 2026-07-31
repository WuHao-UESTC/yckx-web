import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const items = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q } },
        { content: { contains: q } },
        { excerpt: { contains: q } },
      ],
    },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ items, total: items.length });
}
