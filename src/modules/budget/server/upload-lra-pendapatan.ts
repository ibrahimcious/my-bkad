import { UserRole } from '@prisma/client'
import { createServerFn } from '@tanstack/react-start'

import { getSessionUser } from '@/shared/auth/session'
import { prisma } from '@/shared/db'
import { AppError } from '@/shared/lib/errors'
import { logger } from '@/shared/lib/logger'

import { parsePendapatanLRA } from './parse-lra-pendapatan'
import type { UploadResult } from './upload-lra'

/** How many recent upload records the admin page shows. */
const HISTORY_LIMIT = 20

/**
 * Upload and ingest the Pendapatan section of an LRA Excel file.
 * Restricted to the uploader account. The prior Pendapatan dataset is
 * replaced wholesale: the parse → delete → insert → history-record
 * sequence runs inside a single transaction, so a database failure
 * mid-insert leaves the previous data intact. A parse failure happens
 * before the transaction opens, so it likewise leaves existing data
 * untouched. Every attempt is recorded in BudgetPendapatanUploadHistory.
 *
 * This mirrors `uploadLRA` (belanja) but writes the Pendapatan tables;
 * the two pipelines are fully independent.
 */
export const uploadPendapatanLRA = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): File | null => {
    if (!(data instanceof FormData)) return null
    const file = data.get('file')
    return file instanceof File && file.size > 0 ? file : null
  })
  .handler(async ({ data: file }): Promise<UploadResult> => {
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
    logger.info({ fileName, size: file.size }, 'Pendapatan LRA upload started')

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const { rows, warnings } = parsePendapatanLRA(bytes)

      await prisma.$transaction(async (tx) => {
        await tx.budgetPendapatanRealization.deleteMany({})
        await tx.budgetPendapatanRealization.createMany({ data: rows })
        await tx.budgetPendapatanUploadHistory.create({
          data: {
            fileName,
            rowCount: rows.length,
            status: 'SUCCESS',
            message:
              warnings.length > 0
                ? `${warnings.length} baris dilewati saat pemrosesan.`
                : null,
          },
        })
      })

      for (const warning of warnings) {
        logger.warn({ fileName }, warning)
      }
      logger.info(
        { fileName, rowCount: rows.length },
        'Pendapatan LRA upload succeeded',
      )
      return { ok: true, rowCount: rows.length, warnings }
    } catch (error) {
      logger.error({ fileName, err: error }, 'Pendapatan LRA upload failed')
      const message =
        error instanceof AppError
          ? error.message
          : 'Terjadi kesalahan saat memproses berkas LRA Pendapatan.'
      // Best-effort: record the failed attempt. A failure here must not
      // mask the original error.
      try {
        await prisma.budgetPendapatanUploadHistory.create({
          data: { fileName, rowCount: 0, status: 'FAILED', message },
        })
      } catch (historyError) {
        logger.error(
          { fileName, err: historyError },
          'failed to record Pendapatan upload history',
        )
      }
      return { ok: false, error: message }
    }
  })

/**
 * Return the most recent Pendapatan LRA upload attempts, newest first.
 * Used by the admin Pendapatan upload page.
 */
export const getPendapatanUploadHistory = createServerFn({
  method: 'GET',
}).handler(() => {
  return prisma.budgetPendapatanUploadHistory.findMany({
    orderBy: { uploadedAt: 'desc' },
    take: HISTORY_LIMIT,
  })
})
