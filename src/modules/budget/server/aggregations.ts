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

// --- Budget lines --------------------------------------------------------

/** A budget row at any hierarchy level, rolled up to its totals. */
export interface BudgetLineAggregate {
  kode: string
  uraian: string
  totalAnggaran: number
  totalRealisasi: number
  persentaseSerapan: number
}

/** BudgetLineAggregate with sub bidang label attached (Sub Kegiatan lines). */
export interface SubKegiatanLine extends BudgetLineAggregate {
  subBidang: string
}

/** Roll a budget row's amounts up into a {@link BudgetLineAggregate}. */
export function toBudgetLine(
  kode: string,
  uraian: string,
  amounts: BudgetAmounts,
): BudgetLineAggregate {
  const anggaran = totalAnggaran(amounts)
  const realisasi = totalRealisasi(amounts)
  return {
    kode,
    uraian,
    totalAnggaran: anggaran,
    totalRealisasi: realisasi,
    persentaseSerapan: serapanPercent(anggaran, realisasi),
  }
}

// --- Program rankings ----------------------------------------------------

export interface TopPrograms {
  /** Top 10 programs by total Anggaran, highest first. */
  byAnggaran: BudgetLineAggregate[]
  /** Top 5 programs by % serapan, highest first. */
  highestSerapan: BudgetLineAggregate[]
  /** Bottom 5 programs by % serapan, lowest first. */
  lowestSerapan: BudgetLineAggregate[]
}

const TOP_BY_ANGGARAN = 10
const SERAPAN_RANK_SIZE = 5

/** Rank programs by total Anggaran and by % serapan. */
export function rankPrograms(programs: BudgetLineAggregate[]): TopPrograms {
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

// --- Sub Bidang grouping -------------------------------------------------

export interface SubBidangAggregate {
  subBidang: string
  totalAnggaran: number
  totalRealisasi: number
  persentaseSerapan: number
}

/** Label for Sub Kegiatan that have no Sub Bidang mapping yet. */
export const UNMAPPED_SUB_BIDANG = 'Belum ditetapkan'

/**
 * Group Sub Kegiatan realisation by Sub Bidang. `mapping` resolves a
 * Sub Kegiatan `kode` to its Sub Bidang; unmapped Sub Kegiatan are
 * collected under {@link UNMAPPED_SUB_BIDANG}. The result is sorted by
 * total Anggaran, with the unmapped group always last.
 */
export function groupRealisasiBySubBidang(
  subKegiatan: { kode: string; amounts: BudgetAmounts }[],
  mapping: Map<string, string>,
): SubBidangAggregate[] {
  const totals = new Map<string, { anggaran: number; realisasi: number }>()

  for (const { kode, amounts } of subKegiatan) {
    const subBidang = mapping.get(kode) ?? UNMAPPED_SUB_BIDANG
    const acc = totals.get(subBidang) ?? { anggaran: 0, realisasi: 0 }
    acc.anggaran += totalAnggaran(amounts)
    acc.realisasi += totalRealisasi(amounts)
    totals.set(subBidang, acc)
  }

  return [...totals.entries()]
    .map(([subBidang, { anggaran, realisasi }]) => ({
      subBidang,
      totalAnggaran: anggaran,
      totalRealisasi: realisasi,
      persentaseSerapan: serapanPercent(anggaran, realisasi),
    }))
    .sort((a, b) => {
      if (a.subBidang === UNMAPPED_SUB_BIDANG) return 1
      if (b.subBidang === UNMAPPED_SUB_BIDANG) return -1
      return b.totalAnggaran - a.totalAnggaran
    })
}
