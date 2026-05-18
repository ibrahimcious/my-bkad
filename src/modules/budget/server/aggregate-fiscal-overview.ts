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
 * is the account-4 root; Belanja and Pembiayaan are the section totals
 * captured into BudgetKabupatenLraTotal on upload.
 *
 * Note this Belanja is kabupaten-wide and distinct from the per-OPD
 * (BKAD-only) belanja in BudgetRealization that the Belanja dashboard
 * shows.
 */
export const getFiscalOverview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FiscalOverview> => {
    const [pendapatanRoot, sectionTotals, latestUpload] = await Promise.all([
      prisma.budgetPendapatanRealization.findFirst({
        where: { level: 'PENDAPATAN' },
      }),
      prisma.budgetKabupatenLraTotal.findMany(),
      prisma.budgetUploadHistory.findFirst({
        where: { status: 'SUCCESS', kind: 'PENDAPATAN' },
        orderBy: { uploadedAt: 'desc' },
      }),
    ])

    const belanja = sectionTotals.find((total) => total.section === 'BELANJA')
    const pembiayaan = sectionTotals.find(
      (total) => total.section === 'PEMBIAYAAN',
    )

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
