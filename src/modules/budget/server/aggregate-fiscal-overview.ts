import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

/** Kabupaten-wide headline figures for the dashboard overview. */
export interface FiscalOverview {
  pendapatan: { anggaran: number; realisasi: number }
  belanja: { anggaran: number; realisasi: number }
  pembiayaan: { anggaran: number; realisasi: number }
  /** Timestamp of the most recent successful Pendapatan upload. */
  lastUpdatedAt: Date | null
}

const ZERO = { anggaran: 0, realisasi: 0 }

/**
 * Kabupaten-wide Pendapatan, Belanja, and Pembiayaan totals — the three
 * APBD components — all taken from the same full LRA file. Pendapatan
 * is the account-4 root; Belanja and Pembiayaan are the account-5 and
 * account-6 roots captured into their tables on upload.
 *
 * Note this Belanja is kabupaten-wide and distinct from the per-OPD
 * (BKAD-only) belanja in BudgetRealization that the Belanja dashboard
 * shows.
 */
export const getFiscalOverview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FiscalOverview> => {
    const [pendapatanRoot, belanja, pembiayaan, latestUpload] =
      await Promise.all([
        prisma.budgetPendapatanRealization.findFirst({
          where: { level: 'PENDAPATAN' },
        }),
        prisma.budgetKabupatenBelanja.findFirst(),
        prisma.budgetKabupatenPembiayaan.findFirst(),
        prisma.budgetPendapatanUploadHistory.findFirst({
          where: { status: 'SUCCESS' },
          orderBy: { uploadedAt: 'desc' },
        }),
      ])
    return {
      pendapatan: pendapatanRoot
        ? {
            anggaran: pendapatanRoot.anggaran.toNumber(),
            realisasi: pendapatanRoot.realisasi.toNumber(),
          }
        : { ...ZERO },
      belanja: belanja
        ? {
            anggaran: belanja.anggaran.toNumber(),
            realisasi: belanja.realisasi.toNumber(),
          }
        : { ...ZERO },
      pembiayaan: pembiayaan
        ? {
            anggaran: pembiayaan.anggaran.toNumber(),
            realisasi: pembiayaan.realisasi.toNumber(),
          }
        : { ...ZERO },
      lastUpdatedAt: latestUpload?.uploadedAt ?? null,
    }
  },
)
