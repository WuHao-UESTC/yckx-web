import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { createUrlSlug } from "@/lib/url-slug";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/server/auth/guards";
import { assertOwnerOrAdmin } from "@/server/auth/guards";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/server/http/errors";
import type { CreatePostInput, UpdatePostInput } from "../posts.schemas";
import { generateExcerpt } from "../post-text";
import { postApiSelect } from "./post-selects";
import { assertValidPostClassification } from "./post-classification";

async function createUniqueSlug(client: Prisma.TransactionClient, title: string): Promise<string> {
  const baseSlug = createUrlSlug(title);
  const existing = await client.post.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  return existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
}

async function syncPostAttachments(
  tx: Prisma.TransactionClient,
  postId: string,
  attachmentIds: string[],
  userId: string
): Promise<void> {
  const uniqueIds = [...new Set(attachmentIds)];
  const files = await tx.file.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, uploaderId: true, postId: true, photo: { select: { id: true } } },
  });

  if (files.length !== uniqueIds.length) throw new BadRequestError("部分附件不存在");

  for (const file of files) {
    if (file.photo) throw new BadRequestError("日常照片不能同时作为文章附件");
    if (file.postId && file.postId !== postId) {
      throw new BadRequestError("附件已绑定到其他文章");
    }
    if (!file.postId && file.uploaderId !== userId) {
      throw new ForbiddenError("只能添加自己上传的附件");
    }
  }

  await tx.file.updateMany({
    where: { postId, id: { notIn: uniqueIds } },
    data: { postId: null, purpose: "GENERAL", sortOrder: 0 },
  });

  await Promise.all(
    uniqueIds.map((id, index) =>
      tx.file.update({
        where: { id },
        data: { postId, purpose: "ATTACHMENT", sortOrder: index },
      })
    )
  );
}

function createTagRelations(
  tags: string[]
): Prisma.PostTagCreateNestedManyWithoutPostInput | undefined {
  if (tags.length === 0) return undefined;

  return {
    create: tags.map((tagName) => ({
      tag: {
        connectOrCreate: {
          where: { name: tagName },
          create: { name: tagName, slug: createUrlSlug(tagName) },
        },
      },
    })),
  };
}

export async function createPost(input: CreatePostInput, authorId: string) {
  return prisma.$transaction(async (tx) => {
    const categoryId = input.categoryId || null;
    const columnId = input.columnId || null;
    const { technicalColumnIds, newsColumnIds, dailyColumnIds } =
      await assertValidPostClassification(tx, {
        kind: input.kind,
        categoryId,
        columnId,
        technicalColumnIds: input.technicalColumnIds,
        newsColumnIds: input.newsColumnIds,
        dailyColumnIds: input.dailyColumnIds,
      });
    const slug = await createUniqueSlug(tx, input.title);

    const post = await tx.post.create({
      data: {
        title: input.title,
        slug,
        content: input.content,
        excerpt: generateExcerpt(input.content),
        coverImage: input.coverImage || null,
        categoryId,
        columnId,
        renderStyle: input.renderStyle,
        kind: input.kind,
        authorId,
        tags: createTagRelations(input.tags),
      },
      select: { id: true },
    });

    if (technicalColumnIds.length > 0) {
      await tx.postTechnicalColumn.createMany({
        data: technicalColumnIds.map((technicalColumnId) => ({
          postId: post.id,
          columnId: technicalColumnId,
        })),
      });
    }
    if (newsColumnIds.length > 0) {
      await tx.postNewsColumn.createMany({
        data: newsColumnIds.map((newsColumnId) => ({
          postId: post.id,
          columnId: newsColumnId,
        })),
      });
    }
    if (dailyColumnIds.length > 0) {
      await tx.postDailyColumn.createMany({
        data: dailyColumnIds.map((dailyColumnId) => ({
          postId: post.id,
          columnId: dailyColumnId,
        })),
      });
    }

    await syncPostAttachments(tx, post.id, input.attachmentIds, authorId);
    return tx.post.findUniqueOrThrow({ where: { id: post.id }, select: postApiSelect });
  });
}

export async function updatePost(slug: string, input: UpdatePostInput, user: AuthenticatedUser) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({
      where: { slug },
      select: {
        id: true,
        authorId: true,
        publishedAt: true,
        status: true,
        title: true,
        content: true,
        kind: true,
        categoryId: true,
        columnId: true,
        technicalColumns: { select: { columnId: true } },
        newsColumns: { select: { columnId: true } },
        dailyColumns: { select: { columnId: true } },
      },
    });

    if (!post) throw new NotFoundError("文章不存在");
    assertOwnerOrAdmin(user, post.authorId);

    const classification = {
      kind: input.kind ?? post.kind,
      categoryId: input.categoryId === undefined ? post.categoryId : input.categoryId,
      columnId: input.columnId === undefined ? post.columnId : input.columnId,
      technicalColumnIds:
        input.technicalColumnIds ?? post.technicalColumns.map(({ columnId }) => columnId),
      newsColumnIds: input.newsColumnIds ?? post.newsColumns.map(({ columnId }) => columnId),
      dailyColumnIds: input.dailyColumnIds ?? post.dailyColumns.map(({ columnId }) => columnId),
    };
    const { technicalColumnIds, newsColumnIds, dailyColumnIds } =
      await assertValidPostClassification(tx, classification, {
        categoryId: post.categoryId,
        columnId: post.columnId,
        technicalColumnIds: post.technicalColumns.map(({ columnId }) => columnId),
        newsColumnIds: post.newsColumns.map(({ columnId }) => columnId),
        dailyColumnIds: post.dailyColumns.map(({ columnId }) => columnId),
      });

    const nextStatus = input.status ?? post.status;
    const nextTitle = input.title ?? post.title;
    const nextContent = input.content ?? post.content;
    if (nextStatus === "PUBLISHED" && (!nextTitle.trim() || !nextContent.trim())) {
      throw new BadRequestError("发布前必须填写标题和正文");
    }

    const data: Prisma.PostUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.content !== undefined) {
      data.content = input.content;
      data.excerpt = generateExcerpt(input.content);
    }
    if (input.categoryId !== undefined) {
      data.category = input.categoryId
        ? { connect: { id: input.categoryId } }
        : { disconnect: true };
    }
    if (input.columnId !== undefined) {
      data.column = input.columnId ? { connect: { id: input.columnId } } : { disconnect: true };
    }
    if (input.coverImage !== undefined) data.coverImage = input.coverImage || null;
    if (input.kind !== undefined) data.kind = input.kind;
    if (input.renderStyle !== undefined) data.renderStyle = input.renderStyle;
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "PUBLISHED" && !post.publishedAt) data.publishedAt = new Date();
    }
    if (input.tags !== undefined) {
      data.tags = {
        deleteMany: {},
        ...createTagRelations(input.tags),
      };
    }

    if (Object.keys(data).length > 0) {
      await tx.post.update({ where: { id: post.id }, data });
    }
    await tx.postTechnicalColumn.deleteMany({ where: { postId: post.id } });
    if (technicalColumnIds.length > 0) {
      await tx.postTechnicalColumn.createMany({
        data: technicalColumnIds.map((technicalColumnId) => ({
          postId: post.id,
          columnId: technicalColumnId,
        })),
      });
    }
    await tx.postNewsColumn.deleteMany({ where: { postId: post.id } });
    if (newsColumnIds.length > 0) {
      await tx.postNewsColumn.createMany({
        data: newsColumnIds.map((newsColumnId) => ({
          postId: post.id,
          columnId: newsColumnId,
        })),
      });
    }
    await tx.postDailyColumn.deleteMany({ where: { postId: post.id } });
    if (dailyColumnIds.length > 0) {
      await tx.postDailyColumn.createMany({
        data: dailyColumnIds.map((dailyColumnId) => ({
          postId: post.id,
          columnId: dailyColumnId,
        })),
      });
    }
    if (input.attachmentIds !== undefined) {
      await syncPostAttachments(tx, post.id, input.attachmentIds, user.id);
    }

    return tx.post.findUniqueOrThrow({ where: { id: post.id }, select: postApiSelect });
  });
}

export async function deletePost(slug: string, user: AuthenticatedUser) {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  });

  if (!post) throw new NotFoundError("文章不存在");
  assertOwnerOrAdmin(user, post.authorId);

  await prisma.post.delete({ where: { id: post.id } });
}
