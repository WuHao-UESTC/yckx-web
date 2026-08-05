import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCommentSchema, deleteCommentSchema } from "@/modules/comments/comment.schemas";
import { requireAnyUser } from "@/server/auth/guards";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get("postId");
    if (!postId) throw new BadRequestError("缺少文章 ID");
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { status: true } });
    if (!post || post.status !== "PUBLISHED") throw new NotFoundError("文章不存在");
    const comments = await prisma.comment.findMany({
      where: { postId, status: "APPROVED" },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        author: { select: { username: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAnyUser();
    const input = await parseJson(request, createCommentSchema);
    const post = await prisma.post.findUnique({
      where: { id: input.postId },
      select: { status: true },
    });
    if (!post || post.status !== "PUBLISHED") throw new NotFoundError("文章不存在");

    const recent = await prisma.comment.count({
      where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 30_000) } },
    });
    if (recent > 0) throw new BadRequestError("发表评论过于频繁，请稍后再试");
    if (input.parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: input.parentId, postId: input.postId, status: "APPROVED" },
        select: { id: true },
      });
      if (!parent) throw new BadRequestError("回复对象不存在");
    }

    const comment = await prisma.comment.create({
      data: {
        content: input.content,
        postId: input.postId,
        parentId: input.parentId ?? null,
        authorId: user.id,
        status: "APPROVED",
      },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        author: { select: { username: true, displayName: true, avatar: true } },
      },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAnyUser();
    const input = deleteCommentSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const comment = await prisma.comment.findUnique({
      where: { id: input.id },
      select: { authorId: true },
    });
    if (!comment) throw new NotFoundError("评论不存在");
    if (comment.authorId !== user.id && user.role !== "ADMIN") throw new ForbiddenError();
    await prisma.comment.delete({ where: { id: input.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
