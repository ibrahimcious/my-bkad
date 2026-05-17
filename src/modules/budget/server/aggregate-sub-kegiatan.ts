import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { prisma } from '@/shared/db'

import {
  type BudgetLineAggregate,
  type SubKegiatanLine,
  UNMAPPED_SUB_BIDANG,
  toBudgetAmounts,
  toBudgetLine,
} from './aggregations'

/**
 * Every Sub Kegiatan, rolled up to Anggaran/Realisasi totals, with the
 * Sub Bidang label joined from the mapping table. Unmapped rows get
 * UNMAPPED_SUB_BIDANG. Ordering is left to the sortable UI table.
 */
export const getSubKegiatanLines = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SubKegiatanLine[]> => {
    const [rows, mappingRows] = await Promise.all([
      prisma.budgetRealization.findMany({
        where: { level: 'SUB_KEGIATAN' },
        orderBy: { kode: 'asc' },
      }),
      prisma.budgetSubBidangMapping.findMany(),
    ])

    const mapping = new Map(
      mappingRows.map((r) => [r.subKegiatanKode, r.subBidang]),
    )

    return rows.map((row) => ({
      ...toBudgetLine(row.kode, row.uraian, toBudgetAmounts(row)),
      subBidang: mapping.get(row.kode) ?? UNMAPPED_SUB_BIDANG,
    }))
  },
)

/** A Sub Kegiatan together with its Rekening (belanja) line items. */
export interface SubKegiatanDetailResult {
  /** The Sub Kegiatan itself, rolled up. Null when the kode is unknown. */
  subKegiatan: BudgetLineAggregate | null
  /** Sub Bidang label, or null when the Sub Kegiatan has no mapping. */
  subBidang: string | null
  /** Rekening belanja lines under the Sub Kegiatan, ordered by kode. */
  rekening: BudgetLineAggregate[]
}

/**
 * One Sub Kegiatan and the Rekening-level belanja rows the LRA nests
 * under it. Backs the Sub Kegiatan detail route. An unknown `kode`
 * yields a null `subKegiatan` so the route can render a not-found state.
 */
export const getSubKegiatanDetail = createServerFn({ method: 'GET' })
  .inputValidator((kode: unknown) => z.string().min(1).parse(kode))
  .handler(async ({ data: kode }): Promise<SubKegiatanDetailResult> => {
    const [subKegiatanRow, rekeningRows, mappingRow] = await Promise.all([
      prisma.budgetRealization.findFirst({
        where: { level: 'SUB_KEGIATAN', kode },
      }),
      prisma.budgetRealization.findMany({
        where: { level: 'REKENING', parentKode: kode },
        orderBy: { kode: 'asc' },
      }),
      prisma.budgetSubBidangMapping.findUnique({
        where: { subKegiatanKode: kode },
      }),
    ])

    return {
      subKegiatan: subKegiatanRow
        ? toBudgetLine(
            subKegiatanRow.kode,
            subKegiatanRow.uraian,
            toBudgetAmounts(subKegiatanRow),
          )
        : null,
      subBidang: mappingRow?.subBidang ?? null,
      rekening: rekeningRows.map((row) =>
        toBudgetLine(row.kode, row.uraian, toBudgetAmounts(row)),
      ),
    }
  })
