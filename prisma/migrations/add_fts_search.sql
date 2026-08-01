-- PostgreSQL 全文搜索迁移
-- 在 psql 中执行，或通过 prisma migrate dev 后手动运行

-- 1. 新增 tsvector 列（存储分词后的标题+摘要+内容）
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. 创建 GIN 索引加速全文搜索
CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN (search_vector);

-- 3. 创建函数：更新 search_vector
CREATE OR REPLACE FUNCTION posts_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器：插入/更新时自动刷新 search_vector
DROP TRIGGER IF EXISTS trg_posts_search ON posts;
CREATE TRIGGER trg_posts_search
  BEFORE INSERT OR UPDATE OF title, excerpt, content ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_update();

-- 5. 对已有数据初始化 search_vector
UPDATE posts SET search_vector =
  setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(content, '')), 'C');
