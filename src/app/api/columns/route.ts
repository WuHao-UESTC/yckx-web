import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMemberColumn } from "@/modules/taxonomies/server/taxonomy-service";
import { createColumnSchema } from "@/modules/taxonomies/taxonomy.schemas";
import { requireUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function GET() {
  const columns = await prisma.column.findMany({
    where: { isActive: true },
    include: { _count: { select: { posts: true } } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(columns);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = await parseJson(req, createColumnSchema);
    const column = await createMemberColumn(input, user.id);
    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
