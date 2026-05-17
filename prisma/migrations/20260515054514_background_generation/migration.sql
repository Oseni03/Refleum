-- AlterTable
ALTER TABLE "public"."cover_letters" ADD COLUMN     "status" "public"."ResumeStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."outreach" ADD COLUMN     "status" "public"."ResumeStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "content" DROP NOT NULL;
