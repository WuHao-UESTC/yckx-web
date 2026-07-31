import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExcerpt, slugify } from "@/lib/auth-utils";
import { POSTS_PER_PAGE } from "@/lib/constants";

// GET /api/posts — 公开文章列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const categoryId = searchParams.get("categoryId");
  const tag = searchParams.get("tag");
  const status = searchParams.get("status") || "PUBLISHED";
  const postType = searchParams.get("postType");
  const columnId = searchParams.get("columnId");
  const authorId = searchParams.get("authorId");

  const where: Record<string, unknown> = { status };
  if (categoryId) where.categoryId = categoryId;
  if (postType) where.postType = postType;
  if (columnId) where.columnId = columnId;
  if (authorId) where.authorId = authorId;
  if (tag) {
    where.tags = { some: { tag: { slug: tag } } };
  }

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize: POSTS_PER_PAGE,
    totalPages: Math.ceil(total / POSTS_PER_PAGE),
  });
}

// POST /api/posts — 创建文章（需登录）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { title, content, categoryId, tags, coverImage, columnId, postType } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
  }

  let slug = slugify(title);
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      slug,
      content,
      excerpt: generateExcerpt(content),
      coverImage: coverImage || null,
      categoryId: categoryId || null,
      columnId: columnId || null,
      postType: postType || "ARTICLE",
      authorId: userId,
      tags: tags?.length
        ? {
            create: tags.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName, slug: slugify(tagName) },
                },
              },
            })),
          }
        : undefined,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
