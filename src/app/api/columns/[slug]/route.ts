import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { renameMemberColumn } from "@/modules/taxonomies/server/taxonomy-service";
import { renameColumnSchema } from "@/modules/taxonomies/taxonomy.schemas";
import { requireUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

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
      technicalPosts: {
        where: { post: { status: "PUBLISHED", kind: "TECHNICAL" } },
        include: {
          post: {
            include: {
              author: { select: { id: true, username: true, displayName: true } },
              category: true,
              tags: { include: { tag: true } },
            },
          },
        },
        orderBy: { post: { publishedAt: "desc" } },
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
      },
      _count: {
        select: {
          posts: { where: { status: "PUBLISHED" } },
          technicalPosts: { where: { post: { status: "PUBLISHED", kind: "TECHNICAL" } } },
        },
      },
    },
  });

  if (!column) {
    return NextResponse.json({ error: "专栏不存在" }, { status: 404 });
  }

  if (column.type === "TECHNICAL") {
    return NextResponse.json({
      ...column,
      posts: column.technicalPosts.map(({ post }) => post),
      _count: { posts: column._count.technicalPosts },
      technicalPosts: undefined,
    });
  }

  return NextResponse.json(column);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser();
    const { slug } = await params;
    const input = await parseJson(req, renameColumnSchema);
    const column = await renameMemberColumn(slug, input, user);
    revalidatePath("/knowledge-base");
    revalidatePath("/competition");
    revalidatePath("/archive");
    revalidatePath("/routine");
    revalidatePath("/dashboard/taxonomies");
    revalidatePath("/admin/categories");
    return NextResponse.json(column);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
