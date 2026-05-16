import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
  type ProgramAggregate,
  type TopPrograms,
  rankPrograms,
  serapanPercent,
  toBudgetAmounts,
  totalAnggaran,
  totalRealisasi,
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

    const programs: ProgramAggregate[] = rows.map((row) => {
      const amounts = toBudgetAmounts(row)
      const anggaran = totalAnggaran(amounts)
      const realisasi = totalRealisasi(amounts)
      return {
        kode: row.kode,
        uraian: row.uraian,
        totalAnggaran: anggaran,
        totalRealisasi: realisasi,
        persentaseSerapan: serapanPercent(anggaran, realisasi),
      }
    })

    return rankPrograms(programs)
  },
)
