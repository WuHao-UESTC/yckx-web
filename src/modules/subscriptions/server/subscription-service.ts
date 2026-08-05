import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { BadRequestError, NotFoundError } from "@/server/http/errors";
import type { SubscriptionTarget } from "../subscription.schemas";

function targetKey(input: SubscriptionTarget): string {
  if (input.targetType === "SITE") {
    if (!input.siteKey) throw new BadRequestError("请选择订阅板块");
    return `SITE:${input.siteKey}`;
  }
  if (!input.targetId) throw new BadRequestError("请选择分类或专栏");
  return `${input.targetType}:${input.targetId}`;
}

export async function listSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      category: { select: { id: true, name: true, slug: true, type: true } },
      column: { select: { id: true, title: true, slug: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addSubscription(userId: string, input: SubscriptionTarget) {
  const key = targetKey(input);
  let categoryId: string | null = null;
  let columnId: string | null = null;

  if (input.targetType === "CATEGORY") {
    const category = await prisma.category.findUnique({
      where: { id: input.targetId },
      select: { id: true, type: true, isActive: true },
    });
    if (
      !category ||
      !category.isActive ||
      !["KNOWLEDGE", "COMPETITION", "NEWS"].includes(category.type)
    ) {
      throw new NotFoundError("订阅分类不存在或不可用");
    }
    categoryId = category.id;
  }
  if (input.targetType === "COLUMN") {
    const column = await prisma.column.findUnique({
      where: { id: input.targetId },
      select: { id: true, type: true, isActive: true },
    });
    if (!column || !column.isActive || !["TECHNICAL", "NEWS"].includes(column.type)) {
      throw new NotFoundError("订阅专栏不存在或不可用");
    }
    columnId = column.id;
  }

  return prisma.subscription.upsert({
    where: { userId_targetKey: { userId, targetKey: key } },
    create: { userId, targetType: input.targetType, targetKey: key, categoryId, columnId },
    update: {},
  });
}

export async function removeSubscription(userId: string, input: SubscriptionTarget) {
  const key = targetKey(input);
  await prisma.subscription.deleteMany({ where: { userId, targetKey: key } });
}

function escape(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character
  );
}

export async function enqueuePostNotifications(tx: Prisma.TransactionClient, postId: string) {
  const post = await tx.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      kind: true,
      category: { select: { id: true, type: true, slug: true } },
      technicalColumns: { select: { columnId: true } },
      newsColumns: { select: { columnId: true } },
    },
  });
  if (!post || !["TECHNICAL", "NEWS"].includes(post.kind) || post.category?.type === "EVENT")
    return;

  const keys = new Set<string>();
  keys.add("SITE:ALL");
  if (post.kind === "NEWS") keys.add("SITE:NEWS");
  if (post.category?.type === "KNOWLEDGE") keys.add("SITE:KNOWLEDGE");
  if (post.category?.type === "COMPETITION") keys.add("SITE:COMPETITION");
  if (post.category) keys.add(`CATEGORY:${post.category.id}`);
  for (const relation of post.technicalColumns) keys.add(`COLUMN:${relation.columnId}`);
  for (const relation of post.newsColumns) keys.add(`COLUMN:${relation.columnId}`);

  const subscriptions = await tx.subscription.findMany({
    where: { targetKey: { in: [...keys] } },
    select: { userId: true, user: { select: { email: true } } },
  });
  const recipients = new Map<string, string>();
  for (const subscription of subscriptions)
    recipients.set(subscription.userId, subscription.user.email);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const path =
    post.kind === "NEWS"
      ? `/archive/news/${post.slug}`
      : post.category?.type === "COMPETITION"
        ? `/competition/${post.category.slug ?? "uncategorized"}/${post.slug}`
        : `/knowledge-base/${post.category?.slug ?? "uncategorized"}/${post.slug}`;
  const subject = `英才科协信息库更新：${post.title}`;
  const html = `<p>你订阅的内容有新的文章更新：</p><h2>${escape(post.title)}</h2><p>${escape(post.excerpt ?? "")}</p><p><a href="${baseUrl}${path}">阅读文章</a></p>`;
  await tx.emailOutbox.createMany({
    data: [...recipients.entries()].map(([userId, recipient]) => ({
      userId,
      postId: post.id,
      recipient,
      subject,
      html,
      dedupeKey: `${post.id}:${userId}`,
    })),
    skipDuplicates: true,
  });
}
