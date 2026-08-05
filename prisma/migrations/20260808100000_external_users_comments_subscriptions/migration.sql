ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GUEST';

CREATE TYPE "VerificationPurpose" AS ENUM ('REGISTER', 'RESET_PASSWORD');
CREATE TYPE "VerificationChallengeStatus" AS ENUM ('PENDING', 'CONSUMED', 'EXPIRED');
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SubscriptionTargetType" AS ENUM ('SITE', 'CATEGORY', 'COLUMN');
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

ALTER TABLE "users"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

UPDATE "users" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "verification_challenges" (
    "id" TEXT NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "status" "VerificationChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "email" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "passwordHash" TEXT,
    "role" "Role",
    "inviteCode" TEXT,
    "userId" TEXT,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "requestIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "verification_challenges_email_purpose_status_createdAt_idx"
ON "verification_challenges"("email", "purpose", "status", "createdAt");
CREATE INDEX "verification_challenges_expiresAt_idx"
ON "verification_challenges"("expiresAt");

ALTER TABLE "verification_challenges"
ADD CONSTRAINT "verification_challenges_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "status" "CommentStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "moderatedById" TEXT;

CREATE INDEX "comments_postId_status_createdAt_idx"
ON "comments"("postId", "status", "createdAt");

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "SubscriptionTargetType" NOT NULL,
    "targetKey" TEXT NOT NULL,
    "categoryId" TEXT,
    "columnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_userId_targetKey_key"
ON "subscriptions"("userId", "targetKey");
CREATE INDEX "subscriptions_targetType_categoryId_idx"
ON "subscriptions"("targetType", "categoryId");
CREATE INDEX "subscriptions_targetType_columnId_idx"
ON "subscriptions"("targetType", "columnId");

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_columnId_fkey"
FOREIGN KEY ("columnId") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "email_outbox" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_outbox_dedupeKey_key" ON "email_outbox"("dedupeKey");
CREATE INDEX "email_outbox_status_nextAttemptAt_idx"
ON "email_outbox"("status", "nextAttemptAt");
CREATE INDEX "email_outbox_userId_createdAt_idx"
ON "email_outbox"("userId", "createdAt");

ALTER TABLE "email_outbox"
ADD CONSTRAINT "email_outbox_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_outbox"
ADD CONSTRAINT "email_outbox_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
