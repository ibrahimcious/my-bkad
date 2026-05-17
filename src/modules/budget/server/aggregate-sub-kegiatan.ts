import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
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
