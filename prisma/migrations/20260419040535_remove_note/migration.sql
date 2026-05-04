/*
  Warnings:

  - You are about to drop the column `maxNotes` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsers` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NoteVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `activity_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NoteVersion" DROP CONSTRAINT "NoteVersion_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NoteVersion" DROP CONSTRAINT "NoteVersion_noteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NoteVersion" DROP CONSTRAINT "NoteVersion_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."activity_log" DROP CONSTRAINT "activity_log_noteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."activity_log" DROP CONSTRAINT "activity_log_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."activity_log" DROP CONSTRAINT "activity_log_userId_fkey";

-- AlterTable
ALTER TABLE "public"."subscription" DROP COLUMN "maxNotes",
DROP COLUMN "maxUsers";

-- DropTable
DROP TABLE "public"."Note";

-- DropTable
DROP TABLE "public"."NoteVersion";

-- DropTable
DROP TABLE "public"."activity_log";
