import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
  type PendapatanSummary,
  summarizePendapatan,
  toPendapatanAmounts,
} from './pendapatan-aggregations'

/**
 * Pendapatan dashboard summary: total Anggaran, total Realisasi, the
 * prior year's Realisasi, % capaian, and the timestamp of the most
 * recent successful upload. Totals come from the single `PENDAPATAN`
 * root row, which the LRA carries as the grand total.
 */
export const getPendapatanSummary = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PendapatanSummary> => {
    const [root, latestUpload] = await Promise.all([
      prisma.budgetPendapatanRealization.findFirst({
        where: { level: 'PENDAPATAN' },
      }),
      prisma.budgetPendapatanUploadHistory.findFirst({
        where: { status: 'SUCCESS' },
        orderBy: { uploadedAt: 'desc' },
      }),
    ])
    return summarizePendapatan(
      root ? toPendapatanAmounts(root) : null,
      latestUpload?.uploadedAt ?? null,
    )
  },
)
