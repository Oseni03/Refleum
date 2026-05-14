/*
  Warnings:

  - You are about to drop the column `userId` on the `apikey` table. All the data in the column will be lost.
  - Added the required column `referenceId` to the `apikey` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."apikey" DROP CONSTRAINT "apikey_userId_fkey";

-- AlterTable
ALTER TABLE "public"."apikey" DROP COLUMN "userId",
ADD COLUMN     "configId" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "referenceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."invitation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."twoFactor" ADD COLUMN     "verified" BOOLEAN DEFAULT true;

-- CreateIndex
CREATE INDEX "apikey_configId_idx" ON "public"."apikey"("configId");

-- CreateIndex
CREATE INDEX "apikey_referenceId_idx" ON "public"."apikey"("referenceId");

-- CreateIndex
CREATE INDEX "apikey_key_idx" ON "public"."apikey"("key");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "public"."invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "public"."invitation"("email");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "public"."member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "public"."member"("userId");

-- CreateIndex
CREATE INDEX "twoFactor_secret_idx" ON "public"."twoFactor"("secret");

-- CreateIndex
CREATE INDEX "twoFactor_userId_idx" ON "public"."twoFactor"("userId");
