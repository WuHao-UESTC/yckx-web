ALTER TABLE "profiles"
ADD COLUMN "grade" INTEGER,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "qq" TEXT,
ADD COLUMN "wechat" TEXT;

CREATE INDEX "profiles_grade_idx" ON "profiles"("grade");
