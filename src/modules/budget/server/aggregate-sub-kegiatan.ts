import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
  type BudgetLineAggregate,
  toBudgetAmounts,
  toBudgetLine,
} from './aggregations'

/**
 * Every Sub Kegiatan, rolled up to its Anggaran/Realisasi totals — the
 * detail table on the dashboard. Sub Kegiatan are the BudgetRealization
 * rows at `level = 'SUB_KEGIATAN'`; ordering and ranking are left to the
 * UI table, which is sortable.
 */
export const getSubKegiatanLines = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BudgetLineAggregate[]> => {
    const rows = await prisma.budgetRealization.findMany({
      where: { level: 'SUB_KEGIATAN' },
      orderBy: { kode: 'asc' },
    })
    return rows.map((row) =>
      toBudgetLine(row.kode, row.uraian, toBudgetAmounts(row)),
    )
  },
)
