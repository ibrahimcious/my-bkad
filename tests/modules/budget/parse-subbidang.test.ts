import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import { parseSubBidangMapping } from '@/modules/budget/server/parse-subbidang'
import { AppError } from '@/shared/lib/errors'

/** Build an .xlsx workbook from an array-of-arrays and return its bytes. */
function workbookBytes(aoa: unknown[][]): Uint8Array {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'subbidang')
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }))
}

const HEADER = [null, null, null, 'Bidang', 'Sub Bidang', 'Sub Kegiatan']

/** A mapping row: columns C / D / E are kode / bidang / subBidang. */
function row(kode: string, bidang: string, subBidang: string): unknown[] {
  return ['5.02', '5.02.0.00.0.00.01.0000', kode, bidang, subBidang, `Nama ${kode}`]
}

describe('parseSubBidangMapping', () => {
  it('parses and deduplicates the mapping by Sub Kegiatan code', () => {
    const { rows, warnings } = parseSubBidangMapping(
      workbookBytes([
        HEADER,
        row('5.02.01.2.01.0001', 'Sekretariat', 'Sungram'),
        row('5.02.01.2.01.0001', 'Sekretariat', 'Sungram'), // duplicate
        row('5.02.01.2.02.0001', 'Sekretariat', 'Umum dan Kepegawaian'),
      ]),
    )
    expect(rows).toHaveLength(2)
    expect(warnings).toHaveLength(0)
    expect(
      rows.find((r) => r.subKegiatanKode === '5.02.01.2.01.0001'),
    ).toMatchObject({ bidang: 'Sekretariat', subBidang: 'Sungram' })
  })

  it('warns on a conflicting Sub Bidang and keeps the first', () => {
    const { rows, warnings } = parseSubBidangMapping(
      workbookBytes([
        HEADER,
        row('5.02.01.2.01.0001', 'Sekretariat', 'Sungram'),
        row('5.02.01.2.01.0001', 'Sekretariat', 'Anggaran'),
      ]),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.subBidang).toBe('Sungram')
    expect(warnings).toHaveLength(1)
  })

  it('rejects a file without a Sub Bidang column', () => {
    expect(() =>
      parseSubBidangMapping(
        workbookBytes([
          [null, null, null, 'Bidang', 'Sub Kegiatan'],
          ['5.02', 'org', '5.02.01.2.01.0001', 'Sekretariat', 'Nama'],
        ]),
      ),
    ).toThrow(AppError)
  })

  it('rejects a file with no mapping rows', () => {
    expect(() => parseSubBidangMapping(workbookBytes([HEADER]))).toThrow(
      AppError,
    )
  })
})
