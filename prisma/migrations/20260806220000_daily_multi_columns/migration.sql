-- Move daily columns from the legacy single Post.columnId relation to a dedicated many-to-many relation.
CREATE TABLE "post_daily_columns" (
    "postId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_daily_columns_pkey" PRIMARY KEY ("postId", "columnId")
);

CREATE INDEX "post_daily_columns_columnId_createdAt_idx"
ON "post_daily_columns"("columnId", "createdAt");

ALTER TABLE "post_daily_columns"
ADD CONSTRAINT "post_daily_columns_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_daily_columns"
ADD CONSTRAINT "post_daily_columns_columnId_fkey"
FOREIGN KEY ("columnId") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "post_daily_columns" ("postId", "columnId")
SELECT post."id", post."columnId"
FROM "posts" AS post
INNER JOIN "columns" AS column_record ON column_record."id" = post."columnId"
WHERE post."kind" = 'DAILY'
  AND column_record."type" = 'DAILY'
ON CONFLICT ("postId", "columnId") DO NOTHING;

UPDATE "posts" AS post
SET "columnId" = NULL
FROM "columns" AS column_record
WHERE post."columnId" = column_record."id"
  AND post."kind" = 'DAILY'
  AND column_record."type" = 'DAILY';
