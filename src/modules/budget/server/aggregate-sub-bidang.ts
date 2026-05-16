import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import {
  type SubBidangAggregate,
  groupRealisasiBySubBidang,
  toBudgetAmounts,
} from './aggregations'

/**
 * Budget realisation grouped by Sub Bidang (U7). Joins the Sub Kegiatan
 * rows to the Sub Bidang mapping by `kode`; Sub Kegiatan with no mapping
 * roll up under "Belum ditetapkan".
 */
export const getRealisasiBySubBidang = createServerFn({
  method: 'GET',
}).handler(async (): Promise<SubBidangAggregate[]> => {
  const [subKegiatanRows, mappingRows] = await Promise.all([
    prisma.budgetRealization.findMany({ where: { level: 'SUB_KEGIATAN' } }),
    prisma.budgetSubBidangMapping.findMany(),
  ])

  const mapping = new Map(
    mappingRows.map((row) => [row.subKegiatanKode, row.subBidang]),
  )
  const lines = subKegiatanRows.map((row) => ({
    kode: row.kode,
    amounts: toBudgetAmounts(row),
  }))

  return groupRealisasiBySubBidang(lines, mapping)
})
