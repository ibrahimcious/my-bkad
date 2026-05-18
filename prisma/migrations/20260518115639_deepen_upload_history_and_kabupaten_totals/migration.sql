-- CreateEnum
CREATE TYPE "UploadKind" AS ENUM ('BELANJA', 'PENDAPATAN', 'SUB_BIDANG');

-- CreateEnum
CREATE TYPE "LraSection" AS ENUM ('BELANJA', 'PEMBIAYAAN');

-- DropIndex
DROP INDEX "BudgetUploadHistory_uploadedAt_idx";

-- AlterTable
ALTER TABLE "BudgetUploadHistory" ADD COLUMN     "kind" "UploadKind" NOT NULL;

-- DropTable
DROP TABLE "BudgetKabupatenBelanja";

-- DropTable
DROP TABLE "BudgetKabupatenPembiayaan";

-- DropTable
DROP TABLE "BudgetPendapatanUploadHistory";

-- CreateTable
CREATE TABLE "BudgetKabupatenLraTotal" (
    "id" TEXT NOT NULL,
    "section" "LraSection" NOT NULL,
    "anggaran" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasi" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasiPrevYear" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetKabupatenLraTotal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetKabupatenLraTotal_section_key" ON "BudgetKabupatenLraTotal"("section");

-- CreateIndex
CREATE INDEX "BudgetUploadHistory_kind_uploadedAt_idx" ON "BudgetUploadHistory"("kind", "uploadedAt");

