-- CreateTable
CREATE TABLE "BudgetPendapatanUploadHistory" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" "UploadStatus" NOT NULL,
    "message" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetPendapatanUploadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetPendapatanUploadHistory_uploadedAt_idx" ON "BudgetPendapatanUploadHistory"("uploadedAt");
