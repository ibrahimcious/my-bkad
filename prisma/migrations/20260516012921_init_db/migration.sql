-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('KEPALA', 'SEKRETARIS', 'UPLOADER');

-- CreateEnum
CREATE TYPE "BudgetLevel" AS ENUM ('UNSUR', 'PROGRAM', 'KEGIATAN', 'SUB_KEGIATAN', 'REKENING');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRealization" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "parentKode" TEXT,
    "level" "BudgetLevel" NOT NULL,
    "uraian" TEXT NOT NULL,
    "anggaranOperasi" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasiOperasi" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "anggaranModal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasiModal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "anggaranTakTerduga" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasiTakTerduga" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "anggaranTransfer" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "realisasiTransfer" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetRealization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetUploadHistory" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" "UploadStatus" NOT NULL,
    "message" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetUploadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "BudgetRealization_level_idx" ON "BudgetRealization"("level");

-- CreateIndex
CREATE INDEX "BudgetRealization_parentKode_idx" ON "BudgetRealization"("parentKode");

-- CreateIndex
CREATE INDEX "BudgetUploadHistory_uploadedAt_idx" ON "BudgetUploadHistory"("uploadedAt");
