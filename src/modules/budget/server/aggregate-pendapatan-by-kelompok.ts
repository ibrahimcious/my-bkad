import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
  type PendapatanKelompokBreakdown,
  breakdownPendapatanByKelompok,
  toPendapatanAmounts,
} from './pendapatan-aggregations'

/**
 * Anggaran and Realisasi broken down by Kelompok Pendapatan — the
 * depth-2 rows (PAD, Pendapatan Transfer, …). Suitable for direct
 * consumption by the dashboard chart and table.
 */
export const getPendapatanByKelompok = createServerFn({
  method: 'GET',
}).handler(async (): Promise<PendapatanKelompokBreakdown[]> => {
  const rows = await prisma.budgetPendapatanRealization.findMany({
    where: { level: 'KELOMPOK' },
  })
  return breakdownPendapatanByKelompok(
    rows.map((row) => ({
      kode: row.kode,
      uraian: row.uraian,
      amounts: toPendapatanAmounts(row),
    })),
  )
})
