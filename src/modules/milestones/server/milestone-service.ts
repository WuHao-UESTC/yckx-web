import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type MilestoneRecord = {
  id: string;
  occurredAt: Date;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

type MilestoneInput = Pick<MilestoneRecord, "occurredAt" | "title" | "description">;

export function findMilestones(order: "asc" | "desc" = "desc") {
  return order === "asc"
    ? prisma.$queryRaw<MilestoneRecord[]>`
        SELECT "id", "occurredAt", "title", "description", "createdAt", "updatedAt"
        FROM "milestones"
        ORDER BY "occurredAt" ASC, "createdAt" ASC
      `
    : prisma.$queryRaw<MilestoneRecord[]>`
        SELECT "id", "occurredAt", "title", "description", "createdAt", "updatedAt"
        FROM "milestones"
        ORDER BY "occurredAt" DESC, "createdAt" DESC
      `;
}

export function findRecentMilestones(limit: number) {
  return prisma.$queryRaw<MilestoneRecord[]>`
    SELECT "id", "occurredAt", "title", "description", "createdAt", "updatedAt"
    FROM "milestones"
    ORDER BY "occurredAt" DESC, "createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function createMilestone(input: MilestoneInput) {
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO "milestones" (
      "id", "occurredAt", "title", "description", "createdAt", "updatedAt"
    )
    VALUES (${randomUUID()}, ${input.occurredAt}, ${input.title}, ${input.description}, ${now}, ${now})
  `;
}

export async function updateMilestone(id: string, input: MilestoneInput) {
  await prisma.$executeRaw`
    UPDATE "milestones"
    SET
      "occurredAt" = ${input.occurredAt},
      "title" = ${input.title},
      "description" = ${input.description},
      "updatedAt" = ${new Date()}
    WHERE "id" = ${id}
  `;
}

export async function deleteMilestone(id: string) {
  await prisma.$executeRaw`
    DELETE FROM "milestones"
    WHERE "id" = ${id}
  `;
}

export function isMissingMilestonesTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("code" in error) || error.code !== "P2010") return false;
  if (!("meta" in error) || !error.meta || typeof error.meta !== "object") return false;
  return "code" in error.meta && error.meta.code === "42P01";
}
