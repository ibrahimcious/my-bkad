import { PendapatanLevel } from '@prisma/client'
import * as XLSX from 'xlsx'

import { LRAParseError } from '@/shared/lib/errors'

import { type PendapatanRow, pendapatanRowSchema } from '../schema'
import { parseAmount } from './parse-amount'

/** The kabupaten-wide Belanja grand total — the account-5 root row. */
export interface LraBelanjaTotal {
  anggaran: number
  realisasi: number
  realisasiPrevYear: number
}

/** Outcome of parsing the Pendapatan section of an LRA workbook. */
export interface ParsedPendapatan {
  /** Validated Pendapatan rows, ready to persist. */
  rows: PendapatanRow[]
  /** Bahasa Indonesia notes about rows skipped while parsing. */
  warnings: string[]
  /**
   * Kabupaten Belanja grand total from the file's account-5 root, used
   * by the dashboard overview. Null when the file has no Belanja section.
   */
  belanjaTotal: LraBelanjaTotal | null
}

/**
 * Column layout of the Pendapatan LRA sheet (0-based). Unlike the
 * belanja recap, the `kode` is a single column and each row carries one
 * Anggaran and one Realisasi figure. The `%` column (E) is derived in
 * aggregation and not parsed; column F is the prior year's realisation.
 */
const COL_KODE = 0
const COL_URAIAN = 1
const COL_ANGGARAN = 2
const COL_REALISASI = 3
const COL_REALISASI_PREV = 5

/** A code is one or more dot-separated numeric segments, e.g. `4.1.01`. */
const CODE_PATTERN = /^\d+(?:\.\d+)*$/

/**
 * The file is a full LRA (Pendapatan, Belanja, Pembiayaan). Account
 * group `4` — Pendapatan — is parsed in full; the `5` root is captured
 * as the kabupaten Belanja total; everything else is skipped.
 */
const PENDAPATAN_SEGMENT = '4'
const BELANJA_ROOT = '5'

function cellText(cell: unknown): string {
  if (typeof cell === 'string') return cell.trim()
  if (typeof cell === 'number' && Number.isFinite(cell)) return String(cell)
  return ''
}

/** Read the three amount columns of a row; null if any is unreadable. */
function readAmounts(row: unknown[]): LraBelanjaTotal | null {
  const anggaran = parseAmount(row[COL_ANGGARAN])
  const realisasi = parseAmount(row[COL_REALISASI])
  const realisasiPrevYear = parseAmount(row[COL_REALISASI_PREV])
  if (anggaran === null || realisasi === null || realisasiPrevYear === null) {
    return null
  }
  return { anggaran, realisasi, realisasiPrevYear }
}

/**
 * Map a Pendapatan code to its hierarchy level from its segment depth:
 * `4` → PENDAPATAN, `4.1` → KELOMPOK, `4.1.01` → JENIS, and so on.
 * Returns null for an unrecognised depth.
 */
function levelForDepth(depth: number): PendapatanLevel | null {
  switch (depth) {
    case 1:
      return PendapatanLevel.PENDAPATAN
    case 2:
      return PendapatanLevel.KELOMPOK
    case 3:
      return PendapatanLevel.JENIS
    case 4:
      return PendapatanLevel.OBYEK
    case 5:
      return PendapatanLevel.RINCIAN_OBYEK
    case 6:
      return PendapatanLevel.SUB_RINCIAN_OBYEK
    default:
      return null
  }
}

/**
 * Confirm the sheet is an LRA export by locating the header row, which
 * names the "Kode Rekening" and "Anggaran" columns.
 */
function validateHeaders(rows: unknown[][]): void {
  const headerRow = rows.slice(0, 12).find((row) => {
    const labels = row.map((cell) => cellText(cell).toLowerCase())
    return (
      labels.some((label) => label.includes('kode rekening')) &&
      labels.some((label) => label.includes('anggaran'))
    )
  })
  if (!headerRow) {
    throw new LRAParseError(
      'Berkas tidak dikenali sebagai LRA: baris header tidak ditemukan.',
    )
  }
}

/**
 * Parse the Pendapatan section of an LRA Excel export into validated
 * rows, and capture the kabupaten Belanja grand total.
 *
 * The function is pure — it persists nothing and logs nothing. Rows
 * outside account group `4` (Belanja detail, Pembiayaan), JUMLAH
 * subtotal rows, and title/header rows are skipped silently; rows
 * skipped for bad data are reported via `warnings`. Throws
 * {@link LRAParseError} when the file cannot be read or yields no
 * usable Pendapatan data.
 */
export function parsePendapatanLRA(
  input: ArrayBuffer | Uint8Array,
): ParsedPendapatan {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(bytes, { type: 'array' })
  } catch {
    throw new LRAParseError(
      'Berkas tidak dapat dibaca sebagai file Excel (.xlsx).',
    )
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
  if (!sheet) {
    throw new LRAParseError('Berkas Excel tidak memiliki lembar kerja.')
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  })
  if (rows.length === 0) {
    throw new LRAParseError('Berkas LRA kosong.')
  }

  validateHeaders(rows)

  const parsed: PendapatanRow[] = []
  const warnings: string[] = []
  let belanjaTotal: LraBelanjaTotal | null = null

  for (const row of rows) {
    // Title, header, column-numbering, JUMLAH-subtotal and signature
    // rows have an empty or non-code first column.
    const kode = cellText(row[COL_KODE])
    if (!CODE_PATTERN.test(kode)) continue

    // Capture the kabupaten-wide Belanja grand total (account-5 root).
    if (kode === BELANJA_ROOT) {
      belanjaTotal = readAmounts(row) ?? belanjaTotal
      continue
    }

    // Keep only the Pendapatan section; skip Belanja detail and Pembiayaan.
    if (kode.split('.')[0] !== PENDAPATAN_SEGMENT) continue

    const uraian = cellText(row[COL_URAIAN])
    if (!uraian) continue

    const depth = kode.split('.').length
    const level = levelForDepth(depth)
    if (!level) {
      warnings.push(
        `Baris dengan kode "${kode}" memiliki kedalaman kode yang tidak dikenali dan dilewati.`,
      )
      continue
    }

    // A clean dotted hierarchy: the parent is the code minus its last
    // segment. The depth-1 root (`4`) has no parent.
    const parentKode = depth > 1 ? kode.slice(0, kode.lastIndexOf('.')) : null

    const amounts = readAmounts(row)
    if (!amounts) {
      warnings.push(
        `Baris dengan kode "${kode}" dilewati karena nilai rupiah tidak dapat dibaca.`,
      )
      continue
    }

    const candidate = { kode, parentKode, level, uraian, ...amounts }

    const validated = pendapatanRowSchema.safeParse(candidate)
    if (!validated.success) {
      warnings.push(
        `Baris dengan kode "${kode}" dilewati karena data tidak valid.`,
      )
      continue
    }
    parsed.push(validated.data)
  }

  if (parsed.length === 0) {
    throw new LRAParseError(
      'Tidak ada baris data Pendapatan yang valid ditemukan dalam berkas.',
    )
  }

  return { rows: parsed, warnings, belanjaTotal }
}
