-- CreateTable
CREATE TABLE "public"."NoteVersion" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT[],
    "diffBaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteVersion_noteId_idx" ON "public"."NoteVersion"("noteId");

-- CreateIndex
CREATE INDEX "NoteVersion_organizationId_idx" ON "public"."NoteVersion"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteVersion_noteId_versionNumber_key" ON "public"."NoteVersion"("noteId", "versionNumber");

-- AddForeignKey
ALTER TABLE "public"."NoteVersion" ADD CONSTRAINT "NoteVersion_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "public"."Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoteVersion" ADD CONSTRAINT "NoteVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoteVersion" ADD CONSTRAINT "NoteVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
