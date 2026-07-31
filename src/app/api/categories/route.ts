import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(categories);
}
