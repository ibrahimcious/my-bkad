import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import { parseSubBidangMapping } from './parse-subbidang'
import { runUpload } from './upload-handler'

/**
 * Upload the Sub Kegiatan → Sub Bidang mapping spreadsheet. The mapping
 * is reference data: each upload replaces it wholesale. The LRA data is
 * not touched. See {@link runUpload} for the shared pipeline.
 */
export const uploadSubBidangMapping = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(({ data }) =>
    runUpload(
      {
        kind: 'SUB_BIDANG',
        logLabel: 'Sub Bidang mapping',
        errorMessage: 'Terjadi kesalahan saat memproses berkas pemetaan.',
        parse: parseSubBidangMapping,
        persist: async (tx, { rows }) => {
          await tx.budgetSubBidangMapping.deleteMany({})
          await tx.budgetSubBidangMapping.createMany({ data: rows })
        },
      },
      data,
    ),
  )

/** The current Sub Kegiatan → Sub Bidang mapping, for the admin page. */
export const getSubBidangMapping = createServerFn({ method: 'GET' }).handler(
  () =>
    prisma.budgetSubBidangMapping.findMany({
      orderBy: { subKegiatanKode: 'asc' },
    }),
)
