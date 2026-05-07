/*
  Warnings:

  - You are about to drop the column `configId` on the `apikey` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `apikey` table. All the data in the column will be lost.
  - You are about to drop the column `polarCustomerId` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `contentType` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `coverLetter` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `outreachMessage` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `processedData` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `processingStatus` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `cancelAtPeriodEnd` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `canceledAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `checkoutId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `currentPeriodStart` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `customFieldData` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `customerCancellationComment` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `customerCancellationReason` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `discountId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `recurringInterval` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `improvements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jobs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `apikey` table without a default value. This is not possible if the table is not empty.
  - Made the column `slug` on table `organization` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `structuredData` to the `resumes` table without a default value. This is not possible if the table is not empty.
  - Made the column `organizationId` on table `resumes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filename` on table `resumes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `originalMarkdown` on table `resumes` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ResumeStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TailorStrategy" AS ENUM ('NUDGE', 'KEYWORDS', 'FULL');

-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."improvements" DROP CONSTRAINT "improvements_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."improvements" DROP CONSTRAINT "improvements_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."improvements" DROP CONSTRAINT "improvements_originalResumeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."improvements" DROP CONSTRAINT "improvements_tailoredResumeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."improvements" DROP CONSTRAINT "improvements_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."integration" DROP CONSTRAINT "integration_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."jobs" DROP CONSTRAINT "jobs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."llm_configs" DROP CONSTRAINT "llm_configs_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."llm_configs" DROP CONSTRAINT "llm_configs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."resumes" DROP CONSTRAINT "resumes_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."resumes" DROP CONSTRAINT "resumes_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscription" DROP CONSTRAINT "subscription_organizationId_fkey";

-- DropIndex
DROP INDEX "public"."apikey_configId_idx";

-- DropIndex
DROP INDEX "public"."apikey_key_idx";

-- DropIndex
DROP INDEX "public"."apikey_referenceId_idx";

-- DropIndex
DROP INDEX "public"."resumes_parentId_idx";

-- DropIndex
DROP INDEX "public"."resumes_userId_idx";

-- DropIndex
DROP INDEX "public"."resumes_userId_isMaster_idx";

-- AlterTable
ALTER TABLE "public"."apikey" DROP COLUMN "configId",
DROP COLUMN "referenceId",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "rateLimitTimeWindow" SET DEFAULT 60,
ALTER COLUMN "rateLimitMax" SET DEFAULT 100;

-- AlterTable
ALTER TABLE "public"."invitation" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "public"."member" ALTER COLUMN "role" SET DEFAULT 'member',
ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."organization" DROP COLUMN "polarCustomerId",
ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."resumes" DROP COLUMN "content",
DROP COLUMN "contentType",
DROP COLUMN "coverLetter",
DROP COLUMN "outreachMessage",
DROP COLUMN "processedData",
DROP COLUMN "processingStatus",
DROP COLUMN "userId",
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "jobKeywords" JSONB,
ADD COLUMN     "outputLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "status" "public"."ResumeStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "strategy" "public"."TailorStrategy",
ADD COLUMN     "structuredData" JSONB NOT NULL,
ALTER COLUMN "organizationId" SET NOT NULL,
ALTER COLUMN "filename" SET NOT NULL,
ALTER COLUMN "originalMarkdown" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."subscription" DROP COLUMN "amount",
DROP COLUMN "cancelAtPeriodEnd",
DROP COLUMN "canceledAt",
DROP COLUMN "checkoutId",
DROP COLUMN "currency",
DROP COLUMN "currentPeriodStart",
DROP COLUMN "customFieldData",
DROP COLUMN "customerCancellationComment",
DROP COLUMN "customerCancellationReason",
DROP COLUMN "customerId",
DROP COLUMN "discountId",
DROP COLUMN "endedAt",
DROP COLUMN "endsAt",
DROP COLUMN "metadata",
DROP COLUMN "modifiedAt",
DROP COLUMN "productId",
DROP COLUMN "recurringInterval",
DROP COLUMN "startedAt",
DROP COLUMN "subscriptionId",
ADD COLUMN     "plan" "public"."Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "polarCustomerId" TEXT,
ADD COLUMN     "polarSubscriptionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "currentPeriodEnd" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "theme" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."verification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."Notification";

-- DropTable
DROP TABLE "public"."improvements";

-- DropTable
DROP TABLE "public"."jobs";

-- DropEnum
DROP TYPE "public"."ProcessingStatus";

-- CreateTable
CREATE TABLE "public"."usage_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "resumeId" TEXT,
    "polarRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cover_letters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cover_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outreach" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_records_organizationId_idx" ON "public"."usage_records"("organizationId");

-- CreateIndex
CREATE INDEX "usage_records_organizationId_createdAt_idx" ON "public"."usage_records"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "cover_letters_organizationId_idx" ON "public"."cover_letters"("organizationId");

-- CreateIndex
CREATE INDEX "cover_letters_resumeId_idx" ON "public"."cover_letters"("resumeId");

-- CreateIndex
CREATE INDEX "outreach_organizationId_idx" ON "public"."outreach"("organizationId");

-- CreateIndex
CREATE INDEX "outreach_resumeId_idx" ON "public"."outreach"("resumeId");

-- CreateIndex
CREATE INDEX "notification_organizationId_read_idx" ON "public"."notification"("organizationId", "read");

-- CreateIndex
CREATE INDEX "notification_createdAt_idx" ON "public"."notification"("createdAt");

-- CreateIndex
CREATE INDEX "resumes_organizationId_idx" ON "public"."resumes"("organizationId");

-- CreateIndex
CREATE INDEX "resumes_organizationId_isMaster_idx" ON "public"."resumes"("organizationId", "isMaster");

-- CreateIndex
CREATE INDEX "resumes_organizationId_status_idx" ON "public"."resumes"("organizationId", "status");

-- CreateIndex
CREATE INDEX "subscription_organizationId_idx" ON "public"."subscription"("organizationId");

-- AddForeignKey
ALTER TABLE "public"."cover_letters" ADD CONSTRAINT "cover_letters_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outreach" ADD CONSTRAINT "outreach_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."apikey" ADD CONSTRAINT "apikey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
