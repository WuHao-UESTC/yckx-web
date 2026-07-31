import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const columns = await prisma.column.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(columns);
}
