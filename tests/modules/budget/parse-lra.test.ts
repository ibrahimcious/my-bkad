import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import { parseLRA } from '@/modules/budget/server/parse-lra'
import { LRAParseError } from '@/shared/lib/errors'

/** Build an .xlsx workbook from an array-of-arrays and return its bytes. */
function workbookBytes(aoa: unknown[][]): Uint8Array {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Realisasi')
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }))
}

/** Standard Kelompok Belanja header row used by a well-formed LRA sheet. */
const GROUP_HEADER = [
  null, null, null, null, null,
  'Operasi', null, 'Modal', null, 'Tak Terduga', null, 'Transfer', null, 'Jumlah',
]

/** Build a minimal-but-valid LRA workbook wrapping the given data rows. */
function lraWorkbook(
  dataRows: unknown[][],
  groupHeader: unknown[] = GROUP_HEADER,
): Uint8Array {
  return workbookBytes([
    ['KAB. PASURUAN'],
    ['REKAPITULASI BELANJA MENURUT URUSAN PEMERINTAH DAERAH'],
    [null],
    groupHeader,
    [null, null, null, null, null, 'Anggaran', 'Realisasi', 'Anggaran', 'Realisasi', 'Anggaran', 'Realisasi', 'Anggaran', 'Realisasi'],
    ['1', null, null, null, '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    ...dataRows,
  ])
}

// One row per hierarchy level. Columns A–D carry ancestor context; the
// rightmost filled column holds the row's own code.
const UNSUR = ['5', null, null, null, 'UNSUR PENUNJANG', 1000, 200, 0, 0, 0, 0, 0, 0]
const PROGRAM = ['5.02', '5.02.0.00.0.00.01.0000', '5.02.01', null, 'PROGRAM A', 800, 150, 0, 0, 0, 0, 0, 0]
const KEGIATAN = ['5.02', '5.02.0.00.0.00.01.0000', '5.02.01.2.01', null, 'KEGIATAN A', 500, 90, 0, 0, 0, 0, 0, 0]
const SUB_KEGIATAN = ['5.02', '5.02.0.00.0.00.01.0000', '5.02.01.2.01.0001', null, 'SUB KEGIATAN A', 300, 40, 0, 0, 0, 0, 0, 0]
const REKENING = ['5.02', '5.02.0.00.0.00.01.0000', '5.02.01.2.01.0001', '5.1.02', 'Belanja Barang dan Jasa', 300, 40, 0, 0, 0, 0, 0, 0]

describe('parseLRA — happy path', () => {
  it('parses one row per hierarchy level with linked parent codes', () => {
    const { rows } = parseLRA(
      lraWorkbook([UNSUR, PROGRAM, KEGIATAN, SUB_KEGIATAN, REKENING]),
    )

    expect(rows.map((r) => r.level)).toEqual([
      'UNSUR',
      'PROGRAM',
      'KEGIATAN',
      'SUB_KEGIATAN',
      'REKENING',
    ])
    expect(rows.map((r) => r.parentKode)).toEqual([
      null,
      '5',
      '5.02.01',
      '5.02.01.2.01',
      '5.02.01.2.01.0001',
    ])
    expect(rows[0]).toMatchObject({
      kode: '5',
      uraian: 'UNSUR PENUNJANG',
      anggaranOperasi: 1000,
      realisasiOperasi: 200,
    })
  })

  it('skips Urusan and Organisasi rows', () => {
    const urusan = ['5.02', null, null, null, 'KEUANGAN', 800, 150, 0, 0, 0, 0, 0, 0]
    const organisasi = ['5.02', '5.02.0.00.0.00.01.0000', null, null, 'BADAN KEUANGAN', 800, 150, 0, 0, 0, 0, 0, 0]
    const { rows } = parseLRA(
      lraWorkbook([UNSUR, urusan, organisasi, PROGRAM]),
    )
    expect(rows.map((r) => r.level)).toEqual(['UNSUR', 'PROGRAM'])
  })
})

describe('parseLRA — error handling', () => {
  it('rejects a file missing a required Kelompok Belanja column', () => {
    const headerWithoutModal = [
      null, null, null, null, null,
      'Operasi', null, 'Tak Terduga', null, 'Transfer', null, 'Jumlah',
    ]
    expect(() => parseLRA(lraWorkbook([UNSUR], headerWithoutModal))).toThrow(
      /Modal/,
    )
    expect(() => parseLRA(lraWorkbook([UNSUR], headerWithoutModal))).toThrow(
      LRAParseError,
    )
  })

  it('rejects an empty file', () => {
    expect(() => parseLRA(workbookBytes([]))).toThrow(LRAParseError)
  })

  it('rejects a file with no valid data rows', () => {
    expect(() => parseLRA(lraWorkbook([]))).toThrow(
      /tidak ada baris data/i,
    )
  })

  it('skips a malformed row with a warning and keeps parsing', () => {
    // A column-C code of depth 4 matches no known level.
    const malformed = ['5.02', '5.02.0.00.0.00.01.0000', '5.02.01.2', null, 'BARIS RUSAK', 1, 2, 0, 0, 0, 0, 0, 0]
    const { rows, warnings } = parseLRA(lraWorkbook([UNSUR, malformed, PROGRAM]))

    expect(rows.map((r) => r.level)).toEqual(['UNSUR', 'PROGRAM'])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('5.02.01.2')
  })
})

describe('parseLRA — real LRA sample', () => {
  const sample = readFileSync(
    'docs/samples/LRA Program Jan sd 12 Mei 26.xlsx',
  )

  it('parses the real SIPD export end-to-end', () => {
    const { rows } = parseLRA(sample)
    expect(rows.length).toBeGreaterThan(500)

    const unsur = rows.filter((r) => r.level === 'UNSUR')
    expect(unsur).toHaveLength(1)
    expect(unsur[0]?.kode).toBe('5')
    expect(unsur[0]?.anggaranOperasi).toBe(36387492566.45)

    const levels = new Set(rows.map((r) => r.level))
    expect(levels).toContain('PROGRAM')
    expect(levels).toContain('REKENING')
  })
})
