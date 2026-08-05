import "server-only";

import type { PostKind, Prisma } from "@/generated/prisma/client";
import { BadRequestError } from "@/server/http/errors";

type ClassificationClient = Pick<Prisma.TransactionClient, "category" | "column">;

export type PostClassification = {
  kind: PostKind;
  categoryId: string | null;
  columnId: string | null;
  technicalColumnIds?: string[];
};

export async function assertValidPostClassification(
  client: ClassificationClient,
  classification: PostClassification,
  previous?: {
    categoryId: string | null;
    columnId: string | null;
    technicalColumnIds?: string[];
  }
): Promise<string[]> {
  const technicalColumnIds = [...new Set(classification.technicalColumnIds ?? [])];
  const [category, column, technicalColumns] = await Promise.all([
    classification.categoryId
      ? client.category.findUnique({
          where: { id: classification.categoryId },
          select: { id: true, name: true, type: true, isActive: true },
        })
      : null,
    classification.columnId
      ? client.column.findUnique({
          where: { id: classification.columnId },
          select: { id: true, title: true, type: true, isActive: true },
        })
      : null,
    technicalColumnIds.length > 0
      ? client.column.findMany({
          where: { id: { in: technicalColumnIds } },
          select: {
            id: true,
            title: true,
            type: true,
            categoryId: true,
            isActive: true,
          },
        })
      : [],
  ]);

  if (classification.categoryId && !category) throw new BadRequestError("所选分类不存在");
  if (classification.columnId && !column) throw new BadRequestError("所选专栏不存在");
  if (category && !category.isActive && category.id !== previous?.categoryId) {
    throw new BadRequestError(`分类“${category.name}”已停用`);
  }
  if (column && !column.isActive && column.id !== previous?.columnId) {
    throw new BadRequestError(`专栏“${column.title}”已停用`);
  }

  if (classification.kind === "TECHNICAL") {
    if (!category || !["KNOWLEDGE", "COMPETITION"].includes(category.type)) {
      throw new BadRequestError("技术文章必须选择知识分类或竞赛类别");
    }
    if (column) throw new BadRequestError("技术文章不能加入新闻或日常专栏");
    if (technicalColumns.length !== technicalColumnIds.length) {
      throw new BadRequestError("部分技术专栏不存在");
    }

    const validIds: string[] = [];
    for (const technicalColumn of technicalColumns) {
      if (technicalColumn.type !== "TECHNICAL") {
        throw new BadRequestError(`“${technicalColumn.title}”不是技术专栏`);
      }
      if (technicalColumn.categoryId !== category.id) {
        const isPreviousRelation = previous?.technicalColumnIds?.includes(technicalColumn.id);
        const didChangeCategory = previous?.categoryId !== classification.categoryId;
        if (isPreviousRelation && didChangeCategory) continue;
        throw new BadRequestError(`专栏“${technicalColumn.title}”不属于当前文章分类`);
      }
      if (
        !technicalColumn.isActive &&
        !previous?.technicalColumnIds?.includes(technicalColumn.id)
      ) {
        throw new BadRequestError(`专栏“${technicalColumn.title}”已停用`);
      }
      validIds.push(technicalColumn.id);
    }
    return validIds;
  }

  if (technicalColumnIds.length > 0) throw new BadRequestError("只有技术文章可以加入技术专栏");

  if (classification.kind === "NEWS") {
    if (category && !["NEWS", "EVENT", "COLUMN"].includes(category.type)) {
      throw new BadRequestError("新闻不能使用技术文章分类");
    }
    if (column?.type !== undefined && column.type !== "NEWS") {
      throw new BadRequestError("新闻只能加入新闻专栏");
    }
    return [];
  }

  if (category && category.type !== "ROUTINE") {
    throw new BadRequestError("日常文章不能使用技术或新闻分类");
  }
  if (column && column.type !== "DAILY") {
    throw new BadRequestError("日常文章只能加入日常专栏");
  }
  return [];
}
