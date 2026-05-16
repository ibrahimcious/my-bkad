import type { BudgetLevel } from '@prisma/client'

export type { BudgetLevel }

/**
 * The four Kelompok Belanja (expenditure groups) reported in the LRA.
 * Every BudgetRealization row carries an Anggaran (budget) and a
 * Realisasi (realised) amount for each group.
 */
export const KELOMPOK_BELANJA = [
  'OPERASI',
  'MODAL',
  'TAK_TERDUGA',
  'TRANSFER',
] as const

export type KelompokBelanja = (typeof KELOMPOK_BELANJA)[number]
