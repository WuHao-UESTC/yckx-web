BEGIN;

CREATE TYPE "PostKind" AS ENUM ('TECHNICAL', 'NEWS', 'DAILY');
CREATE TYPE "ColumnType" AS ENUM ('NEWS', 'DAILY');
CREATE TYPE "FilePurpose" AS ENUM ('GENERAL', 'ATTACHMENT', 'PHOTO');

ALTER TABLE "categories"
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "categories"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "categories"
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "columns"
  ADD COLUMN "type" "ColumnType" NOT NULL DEFAULT 'NEWS',
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "posts"
  ADD COLUMN "kind" "PostKind";

UPDATE "posts" AS p
SET "kind" = CASE
  WHEN p."postType"::text IN ('NOTE', 'PHOTO') OR EXISTS (
    SELECT 1
    FROM "categories" AS c
    WHERE c."id" = p."categoryId"
      AND c."type"::text = 'ROUTINE'
  ) THEN 'DAILY'::"PostKind"
  WHEN p."columnId" IS NOT NULL OR EXISTS (
    SELECT 1
    FROM "categories" AS c
    WHERE c."id" = p."categoryId"
      AND c."type"::text IN ('NEWS', 'EVENT', 'COLUMN')
  ) THEN 'NEWS'::"PostKind"
  ELSE 'TECHNICAL'::"PostKind"
END;

ALTER TABLE "posts"
  ALTER COLUMN "kind" SET NOT NULL,
  ALTER COLUMN "kind" SET DEFAULT 'TECHNICAL';

DROP INDEX IF EXISTS "posts_status_postType_idx";
ALTER TABLE "posts" DROP COLUMN "postType";
DROP TYPE "PostType";

ALTER TABLE "files"
  ADD COLUMN "purpose" "FilePurpose" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "files"
SET "purpose" = 'ATTACHMENT'
WHERE "postId" IS NOT NULL;

ALTER TABLE "photos"
  ADD COLUMN "fileId" TEXT,
  ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "photos"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "photos"
  ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE UNIQUE INDEX "photos_fileId_key" ON "photos"("fileId");
CREATE INDEX "categories_type_isActive_sortOrder_idx"
  ON "categories"("type", "isActive", "sortOrder");
CREATE INDEX "columns_type_isActive_sortOrder_idx"
  ON "columns"("type", "isActive", "sortOrder");
CREATE INDEX "posts_status_kind_idx" ON "posts"("status", "kind");
CREATE INDEX "posts_kind_status_publishedAt_idx"
  ON "posts"("kind", "status", "publishedAt");
CREATE INDEX "posts_columnId_status_idx" ON "posts"("columnId", "status");
CREATE INDEX "files_uploaderId_createdAt_idx" ON "files"("uploaderId", "createdAt");
CREATE INDEX "files_postId_sortOrder_idx" ON "files"("postId", "sortOrder");
CREATE INDEX "photos_isVisible_sortOrder_idx" ON "photos"("isVisible", "sortOrder");

ALTER TABLE "categories"
  ADD CONSTRAINT "categories_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "columns"
  ADD CONSTRAINT "columns_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "photos"
  ADD CONSTRAINT "photos_fileId_fkey"
  FOREIGN KEY ("fileId") REFERENCES "files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
