/*
  Warnings:

  - You are about to drop the column `originalMarkdown` on the `resumes` table. All the data in the column will be lost.
  - Added the required column `html` to the `resumes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `markdown` to the `resumes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."resumes" DROP COLUMN "originalMarkdown",
ADD COLUMN     "html" TEXT NOT NULL,
ADD COLUMN     "markdown" TEXT NOT NULL;
