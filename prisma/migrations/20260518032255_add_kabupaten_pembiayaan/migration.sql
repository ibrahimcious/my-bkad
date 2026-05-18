-- CreateTable
CREATE TABLE "BudgetKabupatenPembiayaan" (
    "id" TEXT NOT NULL,
    "anggaran" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasi" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasiPrevYear" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetKabupatenPembiayaan_pkey" PRIMARY KEY ("id")
);
