import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { prisma } from '@/shared/db'

import {
  type PendapatanLine,
  toPendapatanAmounts,
  toPendapatanLine,
} from './pendapatan-aggregations'

/** A Kelompok Pendapatan together with its Jenis-level breakdown. */
export interface PendapatanKelompokDetailResult {
  /** The Kelompok itself, rolled up. Null when the kode is unknown. */
  kelompok: PendapatanLine | null
  /** The Jenis rows nested directly under the Kelompok, ordered by kode. */
  jenis: PendapatanLine[]
}

/**
 * One Kelompok Pendapatan and the Jenis rows beneath it (e.g. PAD →
 * Pajak Daerah, Retribusi Daerah, …). Backs the Kelompok detail route.
 * An unknown `kode` yields a null `kelompok` so the route can render a
 * not-found state.
 */
export const getPendapatanKelompokDetail = createServerFn({ method: 'GET' })
  .inputValidator((kode: unknown) => z.string().min(1).parse(kode))
  .handler(async ({ data: kode }): Promise<PendapatanKelompokDetailResult> => {
    const [kelompokRow, jenisRows] = await Promise.all([
      prisma.budgetPendapatanRealization.findFirst({
        where: { level: 'KELOMPOK', kode },
      }),
      prisma.budgetPendapatanRealization.findMany({
        where: { level: 'JENIS', parentKode: kode },
        orderBy: { kode: 'asc' },
      }),
    ])

    return {
      kelompok: kelompokRow
        ? toPendapatanLine(
            kelompokRow.kode,
            kelompokRow.uraian,
            toPendapatanAmounts(kelompokRow),
          )
        : null,
      jenis: jenisRows.map((row) =>
        toPendapatanLine(row.kode, row.uraian, toPendapatanAmounts(row)),
      ),
    }
  })
