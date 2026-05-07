-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- CreateTable
CREATE TABLE "public"."resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'md',
    "filename" TEXT,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "processedData" JSONB,
    "processingStatus" "public"."ProcessingStatus" NOT NULL DEFAULT 'pending',
    "originalMarkdown" TEXT,
    "coverLetter" TEXT,
    "outreachMessage" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "content" TEXT NOT NULL,
    "resumeId" TEXT,
    "jobKeywords" JSONB,
    "jobKeywordsHash" TEXT,
    "previewHash" TEXT,
    "previewHashes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."improvements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "originalResumeId" TEXT NOT NULL,
    "tailoredResumeId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "improvements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "improvements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."llm_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "model" TEXT NOT NULL DEFAULT 'gpt-4o',
    "apiKey" TEXT,
    "apiBase" TEXT,
    "reasoningEffort" TEXT,
    "enableCoverLetter" BOOLEAN NOT NULL DEFAULT false,
    "enableOutreachMessage" BOOLEAN NOT NULL DEFAULT false,
    "contentLanguage" TEXT NOT NULL DEFAULT 'en',
    "defaultPromptId" TEXT NOT NULL DEFAULT 'keywords',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apikey" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT,
    "start" TEXT,
    "referenceId" TEXT NOT NULL,
    "prefix" TEXT,
    "key" TEXT NOT NULL,
    "refillInterval" INTEGER,
    "refillAmount" INTEGER,
    "lastRefillAt" TIMESTAMP(3),
    "enabled" BOOLEAN DEFAULT true,
    "rateLimitEnabled" BOOLEAN DEFAULT true,
    "rateLimitTimeWindow" INTEGER DEFAULT 60000,
    "rateLimitMax" INTEGER DEFAULT 10,
    "requestCount" INTEGER DEFAULT 0,
    "remaining" INTEGER,
    "lastRequest" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "permissions" TEXT,
    "metadata" TEXT,

    CONSTRAINT "apikey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "public"."resumes"("userId");

-- CreateIndex
CREATE INDEX "resumes_userId_isMaster_idx" ON "public"."resumes"("userId", "isMaster");

-- CreateIndex
CREATE INDEX "resumes_parentId_idx" ON "public"."resumes"("parentId");

-- CreateIndex
CREATE INDEX "jobs_userId_idx" ON "public"."jobs"("userId");

-- CreateIndex
CREATE INDEX "jobs_resumeId_idx" ON "public"."jobs"("resumeId");

-- CreateIndex
CREATE INDEX "improvements_userId_idx" ON "public"."improvements"("userId");

-- CreateIndex
CREATE INDEX "improvements_tailoredResumeId_idx" ON "public"."improvements"("tailoredResumeId");

-- CreateIndex
CREATE INDEX "improvements_originalResumeId_idx" ON "public"."improvements"("originalResumeId");

-- CreateIndex
CREATE UNIQUE INDEX "llm_configs_userId_key" ON "public"."llm_configs"("userId");

-- CreateIndex
CREATE INDEX "apikey_configId_idx" ON "public"."apikey"("configId");

-- CreateIndex
CREATE INDEX "apikey_referenceId_idx" ON "public"."apikey"("referenceId");

-- CreateIndex
CREATE INDEX "apikey_key_idx" ON "public"."apikey"("key");

-- AddForeignKey
ALTER TABLE "public"."resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resumes" ADD CONSTRAINT "resumes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resumes" ADD CONSTRAINT "resumes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."improvements" ADD CONSTRAINT "improvements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."improvements" ADD CONSTRAINT "improvements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."improvements" ADD CONSTRAINT "improvements_originalResumeId_fkey" FOREIGN KEY ("originalResumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."improvements" ADD CONSTRAINT "improvements_tailoredResumeId_fkey" FOREIGN KEY ("tailoredResumeId") REFERENCES "public"."resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."improvements" ADD CONSTRAINT "improvements_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."llm_configs" ADD CONSTRAINT "llm_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."llm_configs" ADD CONSTRAINT "llm_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
