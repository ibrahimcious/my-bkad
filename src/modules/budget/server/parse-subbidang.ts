import * as XLSX from 'xlsx'

import { AppError } from '@/shared/lib/errors'

import { type SubBidangRow, subBidangRowSchema } from '../schema'

/** Outcome of parsing a Sub Bidang mapping spreadsheet. */
export interface ParsedSubBidangMapping {
  /** One validated row per unique Sub Kegiatan. */
  rows: SubBidangRow[]
  /** Bahasa Indonesia notes about rows that were skipped or merged. */
  warnings: string[]
}

/**
 * Column layout of the mapping sheet (0-based), per
 * `docs/samples/subbidang.xlsx`. Columns A–B repeat the Urusan and
 * Organisasi codes and are ignored; C–E carry the mapping.
 */
const COL_KODE = 2
const COL_BIDANG = 3
const COL_SUB_BIDANG = 4

function cellText(cell: unknown): string {
  if (typeof cell === 'string') return cell.trim()
  if (typeof cell === 'number' && Number.isFinite(cell)) return String(cell)
  return ''
}

/**
 * Parse a Sub Kegiatan → Sub Bidang mapping spreadsheet. The file is
 * denormalised (one row per LRA line), so rows are deduplicated by
 * `subKegiatanKode`. The function is pure — it persists nothing.
 *
 * Throws {@link AppError} when the file cannot be read, is missing a
 * required column, or yields no usable rows.
 */
export function parseSubBidangMapping(
  input: ArrayBuffer | Uint8Array,
): ParsedSubBidangMapping {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(bytes, { type: 'array' })
  } catch {
    throw new AppError(
      'Berkas tidak dapat dibaca sebagai file Excel (.xlsx).',
    )
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
  if (!sheet) {
    throw new AppError('Berkas Excel tidak memiliki lembar kerja.')
  }

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  })

  // Confirm the sheet is a Sub Bidang mapping by locating its header.
  const headerRow = grid
    .slice(0, 5)
    .find((row) =>
      row.some((cell) => cellText(cell).toLowerCase() === 'sub bidang'),
    )
  if (!headerRow) {
    throw new AppError(
      'Berkas tidak dikenali sebagai pemetaan Sub Bidang: kolom "Sub Bidang" tidak ditemukan.',
    )
  }

  const byKode = new Map<string, SubBidangRow>()
  const warnings: string[] = []

  for (const row of grid) {
    const subKegiatanKode = cellText(row[COL_KODE])
    const bidang = cellText(row[COL_BIDANG])
    const subBidang = cellText(row[COL_SUB_BIDANG])

    // Skip the header row and any row without a code.
    if (!subKegiatanKode || subBidang.toLowerCase() === 'sub bidang') continue

    const parsed = subBidangRowSchema.safeParse({
      subKegiatanKode,
      bidang,
      subBidang,
    })
    if (!parsed.success) {
      warnings.push(
        `Baris untuk Sub Kegiatan "${subKegiatanKode}" dilewati karena data tidak lengkap.`,
      )
      continue
    }

    const existing = byKode.get(subKegiatanKode)
    if (existing) {
      if (existing.subBidang !== parsed.data.subBidang) {
        warnings.push(
          `Sub Kegiatan "${subKegiatanKode}" muncul dengan Sub Bidang berbeda; pemetaan pertama dipertahankan.`,
        )
      }
      continue
    }
    byKode.set(subKegiatanKode, parsed.data)
  }

  if (byKode.size === 0) {
    throw new AppError(
      'Tidak ada baris pemetaan Sub Bidang yang valid ditemukan dalam berkas.',
    )
  }

  return { rows: [...byKode.values()], warnings }
}
