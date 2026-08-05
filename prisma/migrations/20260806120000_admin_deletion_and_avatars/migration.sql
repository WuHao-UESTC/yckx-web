ALTER TYPE "FilePurpose" ADD VALUE IF NOT EXISTS 'AVATAR';

BEGIN;

ALTER TABLE "users" ADD COLUMN "avatarFileId" TEXT;
CREATE UNIQUE INDEX "users_avatarFileId_key" ON "users"("avatarFileId");

ALTER TABLE "users"
  ADD CONSTRAINT "users_avatarFileId_fkey"
  FOREIGN KEY ("avatarFileId") REFERENCES "files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invitations" DROP CONSTRAINT "invitations_createdBy_fkey";
ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profiles" DROP CONSTRAINT "profiles_userId_fkey";
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts" DROP CONSTRAINT "posts_authorId_fkey";
ALTER TABLE "posts"
  ADD CONSTRAINT "posts_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" DROP CONSTRAINT "comments_authorId_fkey";
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "files" DROP CONSTRAINT "files_uploaderId_fkey";
ALTER TABLE "files"
  ADD CONSTRAINT "files_uploaderId_fkey"
  FOREIGN KEY ("uploaderId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "photos" DROP CONSTRAINT "photos_authorId_fkey";
ALTER TABLE "photos"
  ADD CONSTRAINT "photos_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sticky_notes" DROP CONSTRAINT "sticky_notes_authorId_fkey";
ALTER TABLE "sticky_notes"
  ADD CONSTRAINT "sticky_notes_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
