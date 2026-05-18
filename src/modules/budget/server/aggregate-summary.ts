import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import { type BudgetSummary, summarizeBudget, toBudgetAmounts } from './aggregations'

/**
 * Dashboard summary: total Anggaran, total Realisasi, % serapan, and the
 * timestamp of the most recent successful upload. The totals come from
 * the single UNSUR row, which the LRA carries as the grand total.
 */
export const getBudgetSummary = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BudgetSummary> => {
    const [unsur, latestUpload] = await Promise.all([
      prisma.budgetRealization.findFirst({ where: { level: 'UNSUR' } }),
      prisma.budgetUploadHistory.findFirst({
        where: { status: 'SUCCESS', kind: 'BELANJA' },
        orderBy: { uploadedAt: 'desc' },
      }),
    ])
    return summarizeBudget(
      unsur ? toBudgetAmounts(unsur) : null,
      latestUpload?.uploadedAt ?? null,
    )
  },
)
