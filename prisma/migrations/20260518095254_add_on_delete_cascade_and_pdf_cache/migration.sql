-- DropForeignKey
ALTER TABLE "public"."integration" DROP CONSTRAINT "integration_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."resumes" DROP CONSTRAINT "resumes_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscription" DROP CONSTRAINT "subscription_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."usage_records" DROP CONSTRAINT "usage_records_organizationId_fkey";

-- AlterTable
ALTER TABLE "public"."resumes" ADD COLUMN     "pdf" BYTEA;

-- AddForeignKey
ALTER TABLE "public"."subscription" ADD CONSTRAINT "subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_records" ADD CONSTRAINT "usage_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resumes" ADD CONSTRAINT "resumes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."integration" ADD CONSTRAINT "integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
