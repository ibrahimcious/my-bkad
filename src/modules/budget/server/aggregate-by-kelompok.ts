import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
  type KelompokBelanjaBreakdown,
  breakdownByKelompok,
  toBudgetAmounts,
} from './aggregations'

/**
 * Anggaran and Realisasi broken down by the four Kelompok Belanja
 * (Operasi, Modal, Tak Terduga, Transfer), taken from the UNSUR row.
 * Suitable for direct consumption by the dashboard bar chart.
 */
export const getBudgetByKelompok = createServerFn({ method: 'GET' }).handler(
  async (): Promise<KelompokBelanjaBreakdown[]> => {
    const unsur = await prisma.budgetRealization.findFirst({
      where: { level: 'UNSUR' },
    })
    return breakdownByKelompok(unsur ? toBudgetAmounts(unsur) : null)
  },
)
