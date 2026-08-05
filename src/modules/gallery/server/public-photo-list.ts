import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PHOTOS_PER_WALL = 10;

function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parsePublicPhotoQuery(query: {
  photoQ?: string;
  photoFrom?: string;
  photoTo?: string;
  photoPage?: string;
}) {
  const from = parseDate(query.photoFrom);
  const to = parseDate(query.photoTo);
  const exclusiveTo = to ? new Date(to.getTime() + 24 * 60 * 60 * 1000) : null;

  return {
    q: query.photoQ?.trim().slice(0, 100) ?? "",
    from: query.photoFrom && from ? query.photoFrom : "",
    to: query.photoTo && to ? query.photoTo : "",
    page: Math.max(1, Number(query.photoPage) || 1),
    createdAt: {
      ...(from ? { gte: from } : {}),
      ...(exclusiveTo ? { lt: exclusiveTo } : {}),
    },
  };
}

export async function findPublicPhotoPage(query: ReturnType<typeof parsePublicPhotoQuery>) {
  const where: Prisma.PhotoWhereInput = {
    kind: "WALL",
    isVisible: true,
    ...(query.q ? { caption: { contains: query.q, mode: "insensitive" } } : {}),
    ...(Object.keys(query.createdAt).length > 0 ? { createdAt: query.createdAt } : {}),
  };
  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      select: {
        id: true,
        imagePath: true,
        caption: true,
        createdAt: true,
        author: { select: { displayName: true, username: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * PHOTOS_PER_WALL,
      take: PHOTOS_PER_WALL,
    }),
    prisma.photo.count({ where }),
  ]);

  return {
    photos,
    total,
    totalPages: Math.max(1, Math.ceil(total / PHOTOS_PER_WALL)),
  };
}

export function publicPhotoListHref(
  pathname: string,
  query: Pick<ReturnType<typeof parsePublicPhotoQuery>, "q" | "from" | "to" | "page">
) {
  const params = new URLSearchParams();
  if (query.q) params.set("photoQ", query.q);
  if (query.from) params.set("photoFrom", query.from);
  if (query.to) params.set("photoTo", query.to);
  if (query.page > 1) params.set("photoPage", String(query.page));
  const suffix = params.toString();
  return `${suffix ? `${pathname}?${suffix}` : pathname}#photo-wall`;
}
