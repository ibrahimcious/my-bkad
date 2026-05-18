import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import { parsePendapatanLRA } from '@/modules/budget/server/parse-lra-pendapatan'
import { LRAParseError } from '@/shared/lib/errors'

/** Build an .xlsx workbook from an array-of-arrays and return its bytes. */
function workbookBytes(aoa: unknown[][]): Uint8Array {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Worksheet')
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }))
}

/** Header row naming the Kode Rekening and amount columns. */
const HEADER = [
  'Kode Rekening',
  'URAIAN',
  'ANGGARAN',
  'REALISASI 2026',
  '% 2026',
  'REALISASI 2025',
]

/** Wrap data rows in a minimal-but-valid Pendapatan LRA workbook. */
function pendapatanWorkbook(dataRows: unknown[][]): Uint8Array {
  return workbookBytes([
    [null, 'PEMERINTAHAN KAB. PASURUAN'],
    [null, 'LAPORAN REALISASI ANGGARAN'],
    [null],
    HEADER,
    ['1', '2', '3', '4', '5 = (4/3)*100', '6'],
    ...dataRows,
  ])
}

// One row per Pendapatan hierarchy level:
// [kode, uraian, anggaran, realisasi, %, realisasiPrevYear].
const PENDAPATAN = ['4', 'PENDAPATAN DAERAH', 1000, 250, 25, 900]
const KELOMPOK = ['4.1', 'PENDAPATAN ASLI DAERAH (PAD)', 600, 150, 25, 500]
const JENIS = ['4.1.01', 'Pajak Daerah', 400, 100, 25, 350]
const OBYEK = ['4.1.01.09', 'Pajak Reklame', 300, 80, 26.67, 280]
const RINCIAN = ['4.1.01.09.01', 'Pajak Reklame Papan', 200, 50, 25, 180]
const SUB_RINCIAN = ['4.1.01.09.01.0001', 'Pajak Reklame Papan', 200, 50, 25, 180]

describe('parsePendapatanLRA — happy path', () => {
  it('parses one row per hierarchy level with linked parent codes', () => {
    const { rows, belanjaTotal } = parsePendapatanLRA(
      pendapatanWorkbook([
        PENDAPATAN,
        KELOMPOK,
        JENIS,
        OBYEK,
        RINCIAN,
        SUB_RINCIAN,
      ]),
    )

    expect(belanjaTotal).toBeNull()
    expect(rows.map((r) => r.level)).toEqual([
      'PENDAPATAN',
      'KELOMPOK',
      'JENIS',
      'OBYEK',
      'RINCIAN_OBYEK',
      'SUB_RINCIAN_OBYEK',
    ])
    expect(rows.map((r) => r.parentKode)).toEqual([
      null,
      '4',
      '4.1',
      '4.1.01',
      '4.1.01.09',
      '4.1.01.09.01',
    ])
    expect(rows[0]).toMatchObject({
      kode: '4',
      uraian: 'PENDAPATAN DAERAH',
      anggaran: 1000,
      realisasi: 250,
      realisasiPrevYear: 900,
    })
  })

  it('keeps only Pendapatan rows and captures the kabupaten Belanja total', () => {
    const belanja = ['5', 'BELANJA DAERAH', 5000, 1000, 20, 4000]
    const pembiayaan = ['6', 'PEMBIAYAAN DAERAH', 800, 100, 12.5, 700]
    const { rows, belanjaTotal } = parsePendapatanLRA(
      pendapatanWorkbook([PENDAPATAN, belanja, pembiayaan]),
    )
    expect(rows.map((r) => r.kode)).toEqual(['4'])
    expect(belanjaTotal).toEqual({
      anggaran: 5000,
      realisasi: 1000,
      realisasiPrevYear: 4000,
    })
  })

  it('skips JUMLAH subtotal rows (blank code column)', () => {
    const jumlah = [null, 'JUMLAH PENDAPATAN', 1000, 250, 25, 900]
    const { rows } = parsePendapatanLRA(
      pendapatanWorkbook([PENDAPATAN, KELOMPOK, jumlah]),
    )
    expect(rows.map((r) => r.kode)).toEqual(['4', '4.1'])
  })
})

describe('parsePendapatanLRA — error handling', () => {
  it('rejects a file with no recognisable header row', () => {
    expect(() =>
      parsePendapatanLRA(workbookBytes([['foo', 'bar'], PENDAPATAN])),
    ).toThrow(LRAParseError)
  })

  it('rejects an empty file', () => {
    expect(() => parsePendapatanLRA(workbookBytes([]))).toThrow(LRAParseError)
  })

  it('rejects a file with no Pendapatan rows', () => {
    const belanjaOnly = ['5', 'BELANJA DAERAH', 5000, 1000, 20, 4000]
    expect(() =>
      parsePendapatanLRA(pendapatanWorkbook([belanjaOnly])),
    ).toThrow(/tidak ada baris data pendapatan/i)
  })

  it('warns and skips a row whose amount cannot be read', () => {
    const badAmount = ['4.1', 'PAD', 'bukan angka', 150, 25, 500]
    const { rows, warnings } = parsePendapatanLRA(
      pendapatanWorkbook([PENDAPATAN, badAmount]),
    )
    expect(rows.map((r) => r.kode)).toEqual(['4'])
    expect(warnings.some((w) => w.includes('nilai rupiah'))).toBe(true)
  })
})

describe('parsePendapatanLRA — real sample', () => {
  const sample = readFileSync('docs/samples/LRA Pendapatan-18-5-2026.xlsx')

  it('parses the real Pendapatan LRA end-to-end', () => {
    const { rows, belanjaTotal } = parsePendapatanLRA(sample)
    expect(rows.length).toBeGreaterThan(300)

    const root = rows.filter((r) => r.level === 'PENDAPATAN')
    expect(root).toHaveLength(1)
    expect(root[0]?.kode).toBe('4')
    expect(root[0]?.anggaran).toBe(2313980268815.5)
    expect(root[0]?.realisasiPrevYear).toBe(3058731479777.88)

    // Belanja and Pembiayaan sections are excluded from `rows`.
    expect(rows.every((r) => r.kode.split('.')[0] === '4')).toBe(true)

    // The kabupaten Belanja grand total is captured from the 5 root.
    expect(belanjaTotal).not.toBeNull()
    expect(belanjaTotal?.anggaran).toBeGreaterThan(0)
  })
})
