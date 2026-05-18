import { parsePendapatanLRA } from './parse-lra-pendapatan'
import { createUploadFn } from './upload-handler'

/**
 * Upload and ingest the Pendapatan section of a full LRA Excel file.
 * The prior Pendapatan dataset and the kabupaten section totals are
 * replaced wholesale. See {@link createUploadFn} for the shared
 * pipeline.
 */
export const uploadPendapatanLRA = createUploadFn({
  kind: 'PENDAPATAN',
  logLabel: 'Pendapatan LRA',
  errorMessage: 'Terjadi kesalahan saat memproses berkas LRA Pendapatan.',
  parse: parsePendapatanLRA,
  persist: async (tx, { rows, belanjaTotal, pembiayaanTotal }) => {
    await tx.budgetPendapatanRealization.deleteMany({})
    await tx.budgetPendapatanRealization.createMany({ data: rows })
    await tx.budgetKabupatenLraTotal.deleteMany({})
    if (belanjaTotal) {
      await tx.budgetKabupatenLraTotal.create({
        data: { section: 'BELANJA', ...belanjaTotal },
      })
    }
    if (pembiayaanTotal) {
      await tx.budgetKabupatenLraTotal.create({
        data: { section: 'PEMBIAYAAN', ...pembiayaanTotal },
      })
    }
  },
})
