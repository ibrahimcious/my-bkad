import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
  type TopPrograms,
  rankPrograms,
  toBudgetAmounts,
  toBudgetLine,
} from './aggregations'

/**
 * Program rankings for the dashboard: top 10 by Anggaran, and the top
 * and bottom 5 by % serapan. Programs are the BudgetRealization rows at
 * `level = 'PROGRAM'` — a small set, so they are ranked in memory.
 */
export const getTopPrograms = createServerFn({ method: 'GET' }).handler(
  async (): Promise<TopPrograms> => {
    const rows = await prisma.budgetRealization.findMany({
      where: { level: 'PROGRAM' },
    })
    const programs = rows.map((row) =>
      toBudgetLine(row.kode, row.uraian, toBudgetAmounts(row)),
    )
    return rankPrograms(programs)
  },
)
