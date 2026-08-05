import "server-only";

import { prisma } from "@/lib/prisma";
import { createUrlSlug } from "@/lib/url-slug";
import { ConflictError } from "@/server/http/errors";
import type { CreateCategoryInput, CreateColumnInput } from "../taxonomy.schemas";

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
  const slug = createUrlSlug(input.title);
  const existing = await prisma.column.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, description: true, type: true, isActive: true },
  });

  if (existing) {
    assertColumnCanBeReused(existing, input.type);
    return existing;
  }

  try {
    return await prisma.column.create({
      data: {
        title: input.title,
        slug,
        description: input.description || null,
        type: input.type,
        createdById: creatorId,
      },
      select: { id: true, title: true, slug: true, description: true, type: true, isActive: true },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const concurrent = await prisma.column.findUniqueOrThrow({
      where: { slug },
      select: { id: true, title: true, slug: true, description: true, type: true, isActive: true },
    });
    assertColumnCanBeReused(concurrent, input.type);
    return concurrent;
  }
}
