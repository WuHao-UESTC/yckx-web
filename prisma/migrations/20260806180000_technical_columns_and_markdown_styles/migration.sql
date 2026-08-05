-- Add per-article Markdown presentation without changing existing article URLs or content.
CREATE TYPE "MarkdownStyle" AS ENUM ('DEFAULT', 'TECHNICAL', 'PAPER');

ALTER TYPE "ColumnType" ADD VALUE IF NOT EXISTS 'TECHNICAL';

ALTER TABLE "posts"
ADD COLUMN "renderStyle" "MarkdownStyle" NOT NULL DEFAULT 'DEFAULT';

ALTER TABLE "columns"
ADD COLUMN "categoryId" TEXT;

CREATE TABLE "post_technical_columns" (
    "postId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_technical_columns_pkey" PRIMARY KEY ("postId", "columnId")
);

CREATE INDEX "columns_categoryId_isActive_sortOrder_idx"
ON "columns"("categoryId", "isActive", "sortOrder");

CREATE INDEX "post_technical_columns_columnId_createdAt_idx"
ON "post_technical_columns"("columnId", "createdAt");

ALTER TABLE "columns"
ADD CONSTRAINT "columns_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_technical_columns"
ADD CONSTRAINT "post_technical_columns_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_technical_columns"
ADD CONSTRAINT "post_technical_columns_columnId_fkey"
FOREIGN KEY ("columnId") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
