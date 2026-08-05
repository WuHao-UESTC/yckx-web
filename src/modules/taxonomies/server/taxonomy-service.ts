import "server-only";

import { prisma } from "@/lib/prisma";
import { createUrlSlug } from "@/lib/url-slug";
import type { AuthenticatedUser } from "@/server/auth/guards";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/http/errors";
import type {
  CreateCategoryInput,
  CreateColumnInput,
  RenameCategoryInput,
  RenameColumnInput,
} from "../taxonomy.schemas";

function isUniqueConstraintError(error: unknown): error is { code: "P2002" } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function assertCategoryCanBeReused(
  existing: { name: string; type: string; isActive: boolean },
  requestedType: CreateCategoryInput["type"]
): void {
  if (existing.type !== requestedType) {
    throw new ConflictError(`“${existing.name}”已用于其他分类类型`);
  }
  if (!existing.isActive) {
    throw new ConflictError(`“${existing.name}”已被管理员停用，请联系管理员恢复`);
  }
}

function assertColumnCanBeReused(
  existing: { title: string; type: string; isActive: boolean },
  requestedType: CreateColumnInput["type"]
): void {
  if (existing.type !== requestedType) {
    throw new ConflictError(`“${existing.title}”已用于其他专栏类型`);
  }
  if (!existing.isActive) {
    throw new ConflictError(`“${existing.title}”已被管理员停用，请联系管理员恢复`);
  }
}

export async function createMemberCategory(input: CreateCategoryInput, creatorId: string) {
  const slug = createUrlSlug(input.name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name: input.name }] },
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  });

  if (existing) {
    assertCategoryCanBeReused(existing, input.type);
    return existing;
  }

  try {
    return await prisma.category.create({
      data: { name: input.name, slug, type: input.type, createdById: creatorId },
      select: { id: true, name: true, slug: true, type: true, isActive: true },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const concurrent = await prisma.category.findFirstOrThrow({
      where: { OR: [{ slug }, { name: input.name }] },
      select: { id: true, name: true, slug: true, type: true, isActive: true },
    });
    assertCategoryCanBeReused(concurrent, input.type);
    return concurrent;
  }
}

export async function createMemberColumn(input: CreateColumnInput, creatorId: string) {
  const category =
    input.type === "TECHNICAL"
      ? await prisma.category.findUnique({
          where: { id: input.categoryId },
          select: { id: true, name: true, slug: true, type: true, isActive: true },
        })
      : null;

  if (input.type === "TECHNICAL") {
    if (!category || !["KNOWLEDGE", "COMPETITION"].includes(category.type)) {
      throw new BadRequestError("技术专栏必须属于知识分类或竞赛类别");
    }
    if (!category.isActive) throw new BadRequestError(`分类“${category.name}”已停用`);
  }

  const scope = {
    title: input.title,
    type: input.type,
    categoryId: category?.id ?? null,
  } as const;
  const existing = await prisma.column.findFirst({
    where: scope,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      categoryId: true,
      isActive: true,
    },
  });

  if (existing) {
    assertColumnCanBeReused(existing, input.type);
    return existing;
  }

  const slug = createUrlSlug(
    input.type === "TECHNICAL" && category ? `${category.slug}-${input.title}` : input.title
  );

  try {
    return await prisma.column.create({
      data: {
        title: input.title,
        slug,
        description: input.description || null,
        type: input.type,
        categoryId: category?.id ?? null,
        createdById: creatorId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        categoryId: true,
        isActive: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const concurrent = await prisma.column.findFirst({
      where: scope,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        categoryId: true,
        isActive: true,
      },
    });
    if (!concurrent) throw new ConflictError("专栏链接标识发生冲突，请调整专栏标题");
    assertColumnCanBeReused(concurrent, input.type);
    return concurrent;
  }
}

function assertCanRename(
  user: AuthenticatedUser,
  resource: { createdById: string | null },
  noun: string
): void {
  if (user.role === "ADMIN") return;
  if (!resource.createdById || resource.createdById !== user.id) {
    throw new ForbiddenError(`只能重命名自己创建的${noun}`);
  }
}

export async function renameMemberCategory(
  slug: string,
  input: RenameCategoryInput,
  user: AuthenticatedUser
) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, createdById: true },
  });
  if (!category) throw new NotFoundError("分类不存在");
  assertCanRename(user, category, "分类");

  const duplicate = await prisma.category.findFirst({
    where: { name: input.name, id: { not: category.id } },
    select: { id: true },
  });
  if (duplicate) throw new ConflictError(`分类“${input.name}”已存在`);

  return prisma.category.update({
    where: { id: category.id },
    data: { name: input.name },
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  });
}

export async function renameMemberColumn(
  slug: string,
  input: RenameColumnInput,
  user: AuthenticatedUser
) {
  const column = await prisma.column.findUnique({
    where: { slug },
    select: { id: true, title: true, type: true, categoryId: true, createdById: true },
  });
  if (!column) throw new NotFoundError("专栏不存在");
  assertCanRename(user, column, "专栏");

  const duplicate = await prisma.column.findFirst({
    where: {
      id: { not: column.id },
      title: input.title,
      type: column.type,
      categoryId: column.categoryId,
    },
    select: { id: true },
  });
  if (duplicate) throw new ConflictError(`专栏“${input.title}”已存在`);

  return prisma.column.update({
    where: { id: column.id },
    data: { title: input.title },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      categoryId: true,
      isActive: true,
    },
  });
}
