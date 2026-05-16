import { BudgetLevel } from '@prisma/client'
import * as XLSX from 'xlsx'

import { LRAParseError } from '@/shared/lib/errors'

import { type BudgetRow, budgetRowSchema } from '../schema'

/** Outcome of parsing an LRA workbook. */
export interface ParsedLRA {
  /** Validated rows, ready to persist. */
  rows: BudgetRow[]
  /** Bahasa Indonesia notes about rows that were skipped while parsing. */
  warnings: string[]
}

/**
 * Column layout of the LRA sheet (0-based). The hierarchical code
 * occupies columns A–D; a row's own code is the rightmost filled one.
 * Columns E–M hold the description and the eight Kelompok Belanja
 * amounts. The Jumlah and % columns (N–P) are derived in aggregation
 * queries and are not parsed here.
 */
const CODE_COLUMNS = [0, 1, 2, 3] as const
const COL_URAIAN = 4
const AMOUNT_COLUMNS = {
  anggaranOperasi: 5,
  realisasiOperasi: 6,
  anggaranModal: 7,
  realisasiModal: 8,
  anggaranTakTerduga: 9,
  realisasiTakTerduga: 10,
  anggaranTransfer: 11,
  realisasiTransfer: 12,
} as const

/** Kelompok Belanja column headers that must be present in the sheet. */
const REQUIRED_GROUP_HEADERS = ['Operasi', 'Modal', 'Tak Terduga', 'Transfer']

/** A code is one or more dot-separated numeric segments, e.g. `5.02.01`. */
const CODE_PATTERN = /^\d+(?:\.\d+)*$/

function cellText(cell: unknown): string {
  if (typeof cell === 'string') return cell.trim()
  if (typeof cell === 'number' && Number.isFinite(cell)) return String(cell)
  return ''
}

function cellAmount(cell: unknown): number {
  return typeof cell === 'number' && Number.isFinite(cell) ? cell : 0
}

/**
 * Confirm the sheet is an LRA export by locating the Kelompok Belanja
 * header row and checking that every required group column is present.
 */
function validateHeaders(rows: unknown[][]): void {
  const headerRow = rows
    .slice(0, 12)
    .find((row) =>
      row.some((cell) => cellText(cell).toLowerCase() === 'operasi'),
    )
  if (!headerRow) {
    throw new LRAParseError(
      'Berkas tidak dikenali sebagai LRA: baris header "Kelompok Belanja" tidak ditemukan.',
    )
  }
  const labels = headerRow.map((cell) => cellText(cell).toLowerCase())
  for (const header of REQUIRED_GROUP_HEADERS) {
    if (!labels.includes(header.toLowerCase())) {
      throw new LRAParseError(
        `Kolom "${header}" tidak ditemukan dalam berkas LRA.`,
      )
    }
  }
}

/** The row's own code: the value in the rightmost filled code column. */
function extractCode(row: unknown[]): { code: string; column: number } | null {
  let result: { code: string; column: number } | null = null
  for (const column of CODE_COLUMNS) {
    const text = cellText(row[column])
    if (text && CODE_PATTERN.test(text)) {
      result = { code: text, column }
    }
  }
  return result
}

type ClassifiedLevel = BudgetLevel | 'SKIP' | 'UNKNOWN'

/**
 * Map a code to its hierarchy level from the column it occupies and its
 * segment depth. Urusan and Organisasi rows classify as 'SKIP': they
 * are recognised but intentionally not stored, since they duplicate the
 * UNSUR grand total for a single-agency file and the dashboard works
 * from UNSUR downward.
 */
function classifyLevel(code: string, column: number): ClassifiedLevel {
  const depth = code.split('.').length
  switch (column) {
    case 0:
      if (depth === 1) return BudgetLevel.UNSUR
      if (depth === 2) return 'SKIP' // Urusan
      return 'UNKNOWN'
    case 1:
      return 'SKIP' // Organisasi
    case 2:
      if (depth === 3) return BudgetLevel.PROGRAM
      if (depth === 5) return BudgetLevel.KEGIATAN
      if (depth === 6) return BudgetLevel.SUB_KEGIATAN
      return 'UNKNOWN'
    case 3:
      return BudgetLevel.REKENING
    default:
      return 'UNKNOWN'
  }
}

/**
 * Parse an LRA Excel export into validated budget rows.
 *
 * The function is pure — it persists nothing and logs nothing. Skipped
 * rows are reported via `warnings` so the caller can log them. It
 * throws {@link LRAParseError} when the file cannot be read, is missing
 * a required column, or yields no usable data.
 */
export function parseLRA(input: ArrayBuffer | Uint8Array): ParsedLRA {
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

  const parsed: BudgetRow[] = []
  const warnings: string[] = []

  // Running ancestor context. Columns A–D carry ancestors down the
  // sheet, but tracking the last code seen at each level lets every
  // row's parent be resolved without re-reading the context columns.
  let lastUnsur: string | null = null
  let lastProgram: string | null = null
  let lastKegiatan: string | null = null
  let lastSubKegiatan: string | null = null

  for (const row of rows) {
    // A data row always has a descriptive uraian. Title, header,
    // column-numbering and footer rows have an empty or numeric one.
    const uraian = cellText(row[COL_URAIAN])
    if (!uraian || /^\d+$/.test(uraian)) continue

    const codeInfo = extractCode(row)
    if (!codeInfo) continue

    const level = classifyLevel(codeInfo.code, codeInfo.column)
    if (level === 'SKIP') continue
    if (level === 'UNKNOWN') {
      warnings.push(
        `Baris dengan kode "${codeInfo.code}" memiliki format kode yang tidak dikenali dan dilewati.`,
      )
      continue
    }

    let parentKode: string | null = null
    switch (level) {
      case BudgetLevel.UNSUR:
        parentKode = null
        lastUnsur = codeInfo.code
        lastProgram = null
        lastKegiatan = null
        lastSubKegiatan = null
        break
      case BudgetLevel.PROGRAM:
        parentKode = lastUnsur
        lastProgram = codeInfo.code
        lastKegiatan = null
        lastSubKegiatan = null
        break
      case BudgetLevel.KEGIATAN:
        parentKode = lastProgram
        lastKegiatan = codeInfo.code
        lastSubKegiatan = null
        break
      case BudgetLevel.SUB_KEGIATAN:
        parentKode = lastKegiatan
        lastSubKegiatan = codeInfo.code
        break
      case BudgetLevel.REKENING:
        parentKode = lastSubKegiatan
        break
    }

    const candidate = {
      kode: codeInfo.code,
      parentKode,
      level,
      uraian,
      anggaranOperasi: cellAmount(row[AMOUNT_COLUMNS.anggaranOperasi]),
      realisasiOperasi: cellAmount(row[AMOUNT_COLUMNS.realisasiOperasi]),
      anggaranModal: cellAmount(row[AMOUNT_COLUMNS.anggaranModal]),
      realisasiModal: cellAmount(row[AMOUNT_COLUMNS.realisasiModal]),
      anggaranTakTerduga: cellAmount(row[AMOUNT_COLUMNS.anggaranTakTerduga]),
      realisasiTakTerduga: cellAmount(row[AMOUNT_COLUMNS.realisasiTakTerduga]),
      anggaranTransfer: cellAmount(row[AMOUNT_COLUMNS.anggaranTransfer]),
      realisasiTransfer: cellAmount(row[AMOUNT_COLUMNS.realisasiTransfer]),
    }

    const validated = budgetRowSchema.safeParse(candidate)
    if (!validated.success) {
      warnings.push(
        `Baris dengan kode "${codeInfo.code}" dilewati karena data tidak valid.`,
      )
      continue
    }
    parsed.push(validated.data)
  }

  if (parsed.length === 0) {
    throw new LRAParseError(
      'Tidak ada baris data LRA yang valid ditemukan dalam berkas.',
    )
  }

  return { rows: parsed, warnings }
}
