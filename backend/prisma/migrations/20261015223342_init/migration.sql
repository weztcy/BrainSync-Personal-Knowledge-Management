-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('MANUAL', 'INLINE');

-- CreateTable
CREATE TABLE "Note" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteTag" (
    "noteId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "source" "TagSource" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "NoteTag_pkey" PRIMARY KEY ("noteId","tagId")
);

-- CreateTable
CREATE TABLE "NoteLink" (
    "sourceNoteId" UUID NOT NULL,
    "targetNoteId" UUID NOT NULL,

    CONSTRAINT "NoteLink_pkey" PRIMARY KEY ("sourceNoteId","targetNoteId")
);

-- CreateIndex
CREATE INDEX "Note_updatedAt_idx" ON "Note"("updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "NoteTag_tagId_idx" ON "NoteTag"("tagId");

-- CreateIndex
CREATE INDEX "NoteLink_targetNoteId_idx" ON "NoteLink"("targetNoteId");

-- AddForeignKey
ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_sourceNoteId_fkey" FOREIGN KEY ("sourceNoteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_targetNoteId_fkey" FOREIGN KEY ("targetNoteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written additions (not expressible in schema.prisma)
-- ---------------------------------------------------------------------------

-- Fuzzy / typo-tolerant search (PRD 3.4). pg_trgm is a trusted extension on PG13+.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes speed up similarity (%) and ILIKE '%q%' queries used by globalSearch.
CREATE INDEX "Note_title_trgm_idx" ON "Note" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Note_content_trgm_idx" ON "Note" USING GIN ("content" gin_trgm_ops);
CREATE INDEX "Tag_name_trgm_idx" ON "Tag" USING GIN ("name" gin_trgm_ops);

-- [[Wiki links]] resolve by title, so titles must be unique ignoring case.
CREATE UNIQUE INDEX "Note_title_lower_key" ON "Note" (lower("title"));

-- Titles are never blank; tag names are stored lowercase and never blank.
ALTER TABLE "Note" ADD CONSTRAINT "Note_title_not_blank_check" CHECK (length(btrim("title")) > 0);
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_name_normalized_check" CHECK ("name" = lower("name") AND length(btrim("name")) > 0);
