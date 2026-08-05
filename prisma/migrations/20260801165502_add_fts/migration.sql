-- Add a generated search document without exposing it through the Prisma model.
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE INDEX IF NOT EXISTS "posts_search_idx"
ON "posts" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION "posts_search_update"() RETURNS trigger AS $$
BEGIN
  NEW."search_vector" :=
    setweight(to_tsvector('simple', COALESCE(NEW."title", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW."excerpt", '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."content", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_posts_search" ON "posts";
CREATE TRIGGER "trg_posts_search"
  BEFORE INSERT OR UPDATE OF "title", "excerpt", "content" ON "posts"
  FOR EACH ROW EXECUTE FUNCTION "posts_search_update"();

UPDATE "posts"
SET "search_vector" =
  setweight(to_tsvector('simple', COALESCE("title", '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE("excerpt", '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE("content", '')), 'C');
