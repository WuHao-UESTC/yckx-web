import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { createUrlSlug } from "@/lib/url-slug";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/server/auth/guards";
import { assertOwnerOrAdmin } from "@/server/auth/guards";
import { NotFoundError } from "@/server/http/errors";
import type { CreatePostInput, UpdatePostInput } from "../posts.schemas";
import { generateExcerpt } from "../post-text";
import { postApiSelect } from "./post-selects";

async function createUniqueSlug(title: string): Promise<string> {
  const baseSlug = createUrlSlug(title);
  const existing = await prisma.post.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  return existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
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
  const slug = await createUniqueSlug(input.title);

  return prisma.post.create({
    data: {
      title: input.title,
      slug,
      content: input.content,
      excerpt: generateExcerpt(input.content),
      coverImage: input.coverImage || null,
      categoryId: input.categoryId || null,
      columnId: input.columnId || null,
      postType: input.postType,
      authorId,
      tags: createTagRelations(input.tags),
    },
    select: postApiSelect,
  });
}

export async function updatePost(slug: string, input: UpdatePostInput, user: AuthenticatedUser) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({
      where: { slug },
      select: { id: true, authorId: true, publishedAt: true },
    });

    if (!post) throw new NotFoundError("文章不存在");
    assertOwnerOrAdmin(user, post.authorId);

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
    if (input.postType !== undefined) data.postType = input.postType;
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

    return tx.post.update({
      where: { id: post.id },
      data,
      select: postApiSelect,
    });
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
