ALTER TYPE "CategoryType" ADD VALUE IF NOT EXISTS 'NEWS';

INSERT INTO "categories" ("id", "name", "slug", "type", "sortOrder", "createdAt")
VALUES ('category_news', '科协新闻', 'news', 'NEWS', 0, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type";

CREATE TABLE "milestones" (
  "id" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "milestones_occurredAt_idx" ON "milestones"("occurredAt");
