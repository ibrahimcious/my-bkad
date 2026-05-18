import { createServerFn } from '@tanstack/react-start'

import { parseLRA } from './parse-lra'
import { runUpload } from './upload-handler'

/**
 * Upload and ingest a Belanja LRA Excel file. The prior budget dataset
 * is replaced wholesale. See {@link runUpload} for the shared pipeline
 * (role gate, transaction, history, error mapping).
 */
export const uploadLRA = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(({ data }) =>
    runUpload(
      {
        kind: 'BELANJA',
        logLabel: 'LRA',
        errorMessage: 'Terjadi kesalahan saat memproses berkas LRA.',
        parse: parseLRA,
        persist: async (tx, { rows }) => {
          await tx.budgetRealization.deleteMany({})
          await tx.budgetRealization.createMany({ data: rows })
        },
      },
      data,
    ),
  )
