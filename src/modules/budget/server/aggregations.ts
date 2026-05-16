import type { BudgetRealization } from '@prisma/client'

/**
 * Pure aggregation logic for the budget dashboard.
 *
 * This file holds no database or server-function code so it can be unit
 * tested in isolation. The `aggregate-*.ts` server functions fetch rows
 * from Prisma and delegate the arithmetic here.
 */

/** The eight Kelompok Belanja amounts of a budget row, as plain numbers. */
export interface BudgetAmounts {
  anggaranOperasi: number
  realisasiOperasi: number
  anggaranModal: number
  realisasiModal: number
  anggaranTakTerduga: number
  realisasiTakTerduga: number
  anggaranTransfer: number
  realisasiTransfer: number
}

const ZERO_AMOUNTS: BudgetAmounts = {
  anggaranOperasi: 0,
  realisasiOperasi: 0,
  anggaranModal: 0,
  realisasiModal: 0,
  anggaranTakTerduga: 0,
  realisasiTakTerduga: 0,
  anggaranTransfer: 0,
  realisasiTransfer: 0,
}

/** Convert a Prisma BudgetRealization row's Decimal amounts to numbers. */
export function toBudgetAmounts(row: BudgetRealization): BudgetAmounts {
  return {
    anggaranOperasi: row.anggaranOperasi.toNumber(),
    realisasiOperasi: row.realisasiOperasi.toNumber(),
    anggaranModal: row.anggaranModal.toNumber(),
    realisasiModal: row.realisasiModal.toNumber(),
    anggaranTakTerduga: row.anggaranTakTerduga.toNumber(),
    realisasiTakTerduga: row.realisasiTakTerduga.toNumber(),
    anggaranTransfer: row.anggaranTransfer.toNumber(),
    realisasiTransfer: row.realisasiTransfer.toNumber(),
  }
}

/** Total Anggaran across all four Kelompok Belanja. */
export function totalAnggaran(a: BudgetAmounts): number {
  return (
    a.anggaranOperasi +
    a.anggaranModal +
    a.anggaranTakTerduga +
    a.anggaranTransfer
  )
}

/** Total Realisasi across all four Kelompok Belanja. */
export function totalRealisasi(a: BudgetAmounts): number {
  return (
    a.realisasiOperasi +
    a.realisasiModal +
    a.realisasiTakTerduga +
    a.realisasiTransfer
  )
}

/**
 * Percentage of budget realised (serapan), 0-100. Returns 0 when there
 * is no budget, so an empty or zero-anggaran row never yields NaN.
 */
export function serapanPercent(anggaran: number, realisasi: number): number {
  return anggaran > 0 ? (realisasi / anggaran) * 100 : 0
}

// --- Summary -------------------------------------------------------------

export interface BudgetSummary {
  totalAnggaran: number
  totalRealisasi: number
  persentaseSerapan: number
  lastUpdatedAt: Date | null
}

/**
 * Build the dashboard summary from the UNSUR (grand-total) row. A null
 * row — an empty budget table — yields zeros.
 */
export function summarizeBudget(
  unsur: BudgetAmounts | null,
  lastUpdatedAt: Date | null,
): BudgetSummary {
  const amounts = unsur ?? ZERO_AMOUNTS
  const anggaran = totalAnggaran(amounts)
  const realisasi = totalRealisasi(amounts)
  return {
    totalAnggaran: anggaran,
    totalRealisasi: realisasi,
    persentaseSerapan: serapanPercent(anggaran, realisasi),
    lastUpdatedAt,
  }
}

// --- Breakdown by Kelompok Belanja ---------------------------------------

export interface KelompokBelanjaBreakdown {
  /** Bahasa Indonesia display label. */
  kelompok: string
  anggaran: number
  realisasi: number
  persentaseSerapan: number
}

/**
 * Per-Kelompok-Belanja breakdown from the UNSUR (grand-total) row.
 * Always returns the four groups in a fixed order; a null row yields
 * four zero entries.
 */
export function breakdownByKelompok(
  unsur: BudgetAmounts | null,
): KelompokBelanjaBreakdown[] {
  const a = unsur ?? ZERO_AMOUNTS
  return [
    { kelompok: 'Operasi', anggaran: a.anggaranOperasi, realisasi: a.realisasiOperasi },
    { kelompok: 'Modal', anggaran: a.anggaranModal, realisasi: a.realisasiModal },
    { kelompok: 'Tak Terduga', anggaran: a.anggaranTakTerduga, realisasi: a.realisasiTakTerduga },
    { kelompok: 'Transfer', anggaran: a.anggaranTransfer, realisasi: a.realisasiTransfer },
  ].map((group) => ({
    ...group,
    persentaseSerapan: serapanPercent(group.anggaran, group.realisasi),
  }))
}

// --- Program rankings ----------------------------------------------------

export interface ProgramAggregate {
  kode: string
  uraian: string
  totalAnggaran: number
  totalRealisasi: number
  persentaseSerapan: number
}

export interface TopPrograms {
  /** Top 10 programs by total Anggaran, highest first. */
  byAnggaran: ProgramAggregate[]
  /** Top 5 programs by % serapan, highest first. */
  highestSerapan: ProgramAggregate[]
  /** Bottom 5 programs by % serapan, lowest first. */
  lowestSerapan: ProgramAggregate[]
}

const TOP_BY_ANGGARAN = 10
const SERAPAN_RANK_SIZE = 5

/** Rank programs by total Anggaran and by % serapan. */
export function rankPrograms(programs: ProgramAggregate[]): TopPrograms {
  const byAnggaran = [...programs]
    .sort((a, b) => b.totalAnggaran - a.totalAnggaran)
    .slice(0, TOP_BY_ANGGARAN)

  const bySerapanDesc = [...programs].sort(
    (a, b) => b.persentaseSerapan - a.persentaseSerapan,
  )

  return {
    byAnggaran,
    highestSerapan: bySerapanDesc.slice(0, SERAPAN_RANK_SIZE),
    lowestSerapan: bySerapanDesc.slice(-SERAPAN_RANK_SIZE).reverse(),
  }
}
