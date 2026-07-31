import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExcerpt, slugify } from "@/lib/auth-utils";

// GET /api/posts/[slug] — 文章详情
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatar: true } },
      category: true,
      column: true,
      tags: { include: { tag: true } },
      files: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  // 阅读量+1（异步，不阻塞渲染）
  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json(post);
}

// PATCH /api/posts/[slug] — 更新文章
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { slug } = await params;
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }
  if (post.authorId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "无权编辑此文章" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, categoryId, tags, coverImage, columnId, postType, status } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim();
  if (content !== undefined) {
    data.content = content;
    data.excerpt = generateExcerpt(content);
  }
  if (categoryId !== undefined) data.categoryId = categoryId || null;
  if (coverImage !== undefined) data.coverImage = coverImage;
  if (columnId !== undefined) data.columnId = columnId || null;
  if (postType !== undefined) data.postType = postType;
  if (status !== undefined) {
    data.status = status;
    if (status === "PUBLISHED" && !post.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  // 更新标签
  if (tags !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    if (tags.length) {
      await prisma.postTag.createMany({
        data: await Promise.all(
          tags.map(async (tagName: string) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName, slug: slugify(tagName) },
            });
            return { postId: post.id, tagId: tag.id };
          })
        ),
      });
    }
  }

  const updated = await prisma.post.update({
    where: { id: post.id },
    data,
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      category: true,
      tags: { include: { tag: true } },
      files: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/posts/[slug] — 删除文章
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { slug } = await params;
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }
  if (post.authorId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "无权删除此文章" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: post.id } });
  return NextResponse.json({ success: true });
}
