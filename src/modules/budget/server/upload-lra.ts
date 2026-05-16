import { UserRole } from '@prisma/client'
import { createServerFn } from '@tanstack/react-start'

import { getSessionUser } from '@/shared/auth/session'
import { prisma } from '@/shared/db'
import { AppError } from '@/shared/lib/errors'
import { logger } from '@/shared/lib/logger'

import { parseLRA } from './parse-lra'

/** Result of an LRA upload attempt, returned to the admin upload page. */
export type UploadResult =
  | { ok: true; rowCount: number; warnings: string[] }
  | { ok: false; error: string }

/**
 * Upload and ingest an LRA Excel file. Restricted to the uploader
 * account. The prior budget dataset is replaced wholesale: the parse →
 * delete → insert → history-record sequence runs inside a single
 * transaction, so a database failure mid-insert leaves the previous
 * data intact. A parse failure happens before the transaction opens,
 * so it likewise leaves existing data untouched. Every attempt —
 * success or failure — is recorded in BudgetUploadHistory.
 */
export const uploadLRA = createServerFn({ method: 'POST' })
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
    logger.info({ fileName, size: file.size }, 'LRA upload started')

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const { rows, warnings } = parseLRA(bytes)

      await prisma.$transaction(async (tx) => {
        await tx.budgetRealization.deleteMany({})
        await tx.budgetRealization.createMany({ data: rows })
        await tx.budgetUploadHistory.create({
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
      logger.info({ fileName, rowCount: rows.length }, 'LRA upload succeeded')
      return { ok: true, rowCount: rows.length, warnings }
    } catch (error) {
      logger.error({ fileName, err: error }, 'LRA upload failed')
      const message =
        error instanceof AppError
          ? error.message
          : 'Terjadi kesalahan saat memproses berkas LRA.'
      // Best-effort: record the failed attempt. A failure here (e.g. the
      // database is unreachable) must not mask the original error.
      try {
        await prisma.budgetUploadHistory.create({
          data: { fileName, rowCount: 0, status: 'FAILED', message },
        })
      } catch (historyError) {
        logger.error(
          { fileName, err: historyError },
          'failed to record upload history',
        )
      }
      return { ok: false, error: message }
    }
  })
