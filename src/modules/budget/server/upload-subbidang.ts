import { UserRole } from '@prisma/client'
import { createServerFn } from '@tanstack/react-start'

import { getSessionUser } from '@/shared/auth/session'
import { prisma } from '@/shared/db'
import { AppError } from '@/shared/lib/errors'
import { logger } from '@/shared/lib/logger'

import { parseSubBidangMapping } from './parse-subbidang'

/** Result of a Sub Bidang mapping upload attempt. */
export type SubBidangUploadResult =
  | { ok: true; count: number; warnings: string[] }
  | { ok: false; error: string }

/**
 * Upload the Sub Kegiatan → Sub Bidang mapping spreadsheet. Restricted
 * to the uploader account. The mapping is reference data: each upload
 * replaces it wholesale, in a single transaction. The LRA data is not
 * touched.
 */
export const uploadSubBidangMapping = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): File | null => {
    if (!(data instanceof FormData)) return null
    const file = data.get('file')
    return file instanceof File && file.size > 0 ? file : null
  })
  .handler(async ({ data: file }): Promise<SubBidangUploadResult> => {
    const user = await getSessionUser()
    if (!user || user.role !== UserRole.UPLOADER) {
      return {
        ok: false,
        error: 'Anda tidak memiliki akses untuk mengunggah data.',
      }
    }
    if (!file) {
      return { ok: false, error: 'Tidak ada berkas yang dipilih.' }
    }

    const fileName = file.name
    logger.info({ fileName }, 'Sub Bidang mapping upload started')

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const { rows, warnings } = parseSubBidangMapping(bytes)

      await prisma.$transaction(async (tx) => {
        await tx.budgetSubBidangMapping.deleteMany({})
        await tx.budgetSubBidangMapping.createMany({ data: rows })
      })

      for (const warning of warnings) {
        logger.warn({ fileName }, warning)
      }
      logger.info(
        { fileName, count: rows.length },
        'Sub Bidang mapping upload succeeded',
      )
      return { ok: true, count: rows.length, warnings }
    } catch (error) {
      logger.error({ fileName, err: error }, 'Sub Bidang mapping upload failed')
      const message =
        error instanceof AppError
          ? error.message
          : 'Terjadi kesalahan saat memproses berkas pemetaan.'
      return { ok: false, error: message }
    }
  })

/** The current Sub Kegiatan → Sub Bidang mapping, for the admin page. */
export const getSubBidangMapping = createServerFn({ method: 'GET' }).handler(
  () =>
    prisma.budgetSubBidangMapping.findMany({
      orderBy: { subKegiatanKode: 'asc' },
    }),
)
