-- CreateEnum
CREATE TYPE "PendapatanLevel" AS ENUM ('PENDAPATAN', 'KELOMPOK', 'JENIS', 'OBYEK', 'RINCIAN_OBYEK', 'SUB_RINCIAN_OBYEK');

-- CreateTable
CREATE TABLE "BudgetPendapatanRealization" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "parentKode" TEXT,
    "level" "PendapatanLevel" NOT NULL,
    "uraian" TEXT NOT NULL,
    "anggaran" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasi" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasiPrevYear" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetPendapatanRealization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetPendapatanRealization_level_idx" ON "BudgetPendapatanRealization"("level");

-- CreateIndex
CREATE INDEX "BudgetPendapatanRealization_parentKode_idx" ON "BudgetPendapatanRealization"("parentKode");
