import type { BudgetPendapatanRealization } from '@prisma/client'

/**
 * Pure aggregation logic for the Pendapatan dashboard.
 *
 * No database or server-function code lives here so it can be unit
 * tested in isolation; the `aggregate-pendapatan-*.ts` server functions
 * fetch rows from Prisma and delegate the arithmetic here.
 */

/** The amounts of a Pendapatan row, as plain numbers. */
export interface PendapatanAmounts {
  anggaran: number
  realisasi: number
  realisasiPrevYear: number
}

const ZERO_AMOUNTS: PendapatanAmounts = {
  anggaran: 0,
  realisasi: 0,
  realisasiPrevYear: 0,
}

/** Convert a Prisma row's Decimal amounts to numbers. */
export function toPendapatanAmounts(
  row: BudgetPendapatanRealization,
): PendapatanAmounts {
  return {
    anggaran: row.anggaran.toNumber(),
    realisasi: row.realisasi.toNumber(),
    realisasiPrevYear: row.realisasiPrevYear.toNumber(),
  }
}

/**
 * Realisation as a percentage of the target Anggaran (0-100). Returns 0
 * when there is no target, so an empty or zero-anggaran row never
 * yields NaN.
 */
export function capaianPercent(anggaran: number, realisasi: number): number {
  return anggaran > 0 ? (realisasi / anggaran) * 100 : 0
}

// --- Summary -------------------------------------------------------------

export interface PendapatanSummary {
  totalAnggaran: number
  totalRealisasi: number
  totalRealisasiPrevYear: number
  persentaseCapaian: number
  lastUpdatedAt: Date | null
}

/**
 * Build the Pendapatan summary from the depth-1 `PENDAPATAN` root row,
 * which the LRA carries as the grand total. A null row — an empty
 * Pendapatan table — yields zeros.
 */
export function summarizePendapatan(
  root: PendapatanAmounts | null,
  lastUpdatedAt: Date | null,
): PendapatanSummary {
  const amounts = root ?? ZERO_AMOUNTS
  return {
    totalAnggaran: amounts.anggaran,
    totalRealisasi: amounts.realisasi,
    totalRealisasiPrevYear: amounts.realisasiPrevYear,
    persentaseCapaian: capaianPercent(amounts.anggaran, amounts.realisasi),
    lastUpdatedAt,
  }
}

// --- Pendapatan lines ----------------------------------------------------

/** A Pendapatan row at any hierarchy level, rolled up to its totals. */
export interface PendapatanLine {
  kode: string
  /** Bahasa Indonesia display label. */
  uraian: string
  anggaran: number
  realisasi: number
  persentaseCapaian: number
}

/** Roll a Pendapatan row's amounts up into a {@link PendapatanLine}. */
export function toPendapatanLine(
  kode: string,
  uraian: string,
  amounts: PendapatanAmounts,
): PendapatanLine {
  return {
    kode,
    uraian,
    anggaran: amounts.anggaran,
    realisasi: amounts.realisasi,
    persentaseCapaian: capaianPercent(amounts.anggaran, amounts.realisasi),
  }
}

/**
 * Per-Kelompok breakdown from the depth-2 Pendapatan rows (PAD,
 * Pendapatan Transfer, …), sorted by Anggaran, largest first.
 */
export function breakdownPendapatanByKelompok(
  kelompok: { kode: string; uraian: string; amounts: PendapatanAmounts }[],
): PendapatanLine[] {
  return kelompok
    .map(({ kode, uraian, amounts }) => toPendapatanLine(kode, uraian, amounts))
    .sort((a, b) => b.anggaran - a.anggaran)
}
