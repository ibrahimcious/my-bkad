-- CreateTable
CREATE TABLE "BudgetSubBidangMapping" (
    "id" TEXT NOT NULL,
    "subKegiatanKode" TEXT NOT NULL,
    "bidang" TEXT NOT NULL,
    "subBidang" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetSubBidangMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetSubBidangMapping_subKegiatanKode_key" ON "BudgetSubBidangMapping"("subKegiatanKode");

-- CreateIndex
CREATE INDEX "BudgetSubBidangMapping_subBidang_idx" ON "BudgetSubBidangMapping"("subBidang");
