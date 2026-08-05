import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMemberCategory } from "@/modules/taxonomies/server/taxonomy-service";
import { createCategorySchema } from "@/modules/taxonomies/taxonomy.schemas";
import { requireUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { posts: true } } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = await parseJson(req, createCategorySchema);
    const category = await createMemberCategory(input, user.id);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
