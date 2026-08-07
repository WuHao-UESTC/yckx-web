import { NextRequest, NextResponse } from "next/server";
import { updateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { createPostSchema, postListQuerySchema } from "@/modules/posts/posts.schemas";
import { createPost } from "@/modules/posts/server/post-service";
import { postListSelect } from "@/modules/posts/server/post-selects";
import { requireUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

// GET /api/posts — 公开文章列表
export async function GET(req: NextRequest) {
  try {
    const query = postListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Prisma.PostWhereInput = {};

    if (query.status === "PUBLISHED") {
      where.status = "PUBLISHED";
      if (query.authorId) where.authorId = query.authorId;
    } else {
      const user = await requireUser();
      if (query.status !== "all") where.status = query.status;
      where.authorId = user.role === "ADMIN" ? query.authorId : user.id;
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.kind) where.kind = query.kind;
    if (query.columnId) where.columnId = query.columnId;
    if (query.tag) where.tags = { some: { tag: { slug: query.tag } } };

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: postListSelect,
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        skip: (query.page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page: query.page,
      pageSize: POSTS_PER_PAGE,
      totalPages: Math.ceil(total / POSTS_PER_PAGE),
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

// POST /api/posts — 创建文章（需登录）
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = await parseJson(req, createPostSchema);
    const post = await createPost(input, user.id);
    updateTag("posts");
    updateTag(`friend:${post.author.username}`);
    updateTag("friends");
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
