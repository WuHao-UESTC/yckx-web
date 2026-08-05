CREATE TYPE "PhotoKind" AS ENUM ('WALL', 'GROUP');

ALTER TABLE "photos"
ADD COLUMN "kind" "PhotoKind" NOT NULL DEFAULT 'WALL',
ADD COLUMN "year" INTEGER;

DROP INDEX IF EXISTS "photos_isVisible_sortOrder_idx";

CREATE INDEX "photos_kind_isVisible_sortOrder_idx"
ON "photos"("kind", "isVisible", "sortOrder");
