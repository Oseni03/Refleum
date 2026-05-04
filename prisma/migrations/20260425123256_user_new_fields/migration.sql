-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "title" TEXT;
