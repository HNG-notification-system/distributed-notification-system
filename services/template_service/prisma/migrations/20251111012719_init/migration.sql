/*
  Warnings:

  - You are about to drop the column `slug` on the `templates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[template_code]` on the table `templates` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "template_versions_version_idx";

-- DropIndex
DROP INDEX "templates_slug_idx";

-- DropIndex
DROP INDEX "templates_slug_key";

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "slug",
ADD COLUMN     "template_code" TEXT NOT NULL DEFAULT 'TEMP_CODE';

-- CreateIndex
CREATE UNIQUE INDEX "templates_template_code_key" ON "templates"("template_code");

-- CreateIndex
CREATE INDEX "templates_template_code_idx" ON "templates"("template_code");
