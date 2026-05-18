import { type Prisma, type UploadKind, UserRole } from '@prisma/client'

import { getSessionUser } from '@/shared/auth/session'
import { prisma } from '@/shared/db'
import { AppError } from '@/shared/lib/errors'
import { logger } from '@/shared/lib/logger'

/** Result of an upload attempt, returned to the admin upload pages. */
export type UploadResult =
  | { ok: true; rowCount: number; warnings: string[] }
  | { ok: false; error: string }

/** The minimum a parser must yield for the upload handler to work. */
interface ParsedUpload {
  rows: readonly unknown[]
  warnings: string[]
}

export interface UploadConfig<P extends ParsedUpload> {
  /** Which dataset — recorded on the BudgetUploadHistory row. */
  kind: UploadKind
  /** Human label for log lines, e.g. "LRA". */
  logLabel: string
  /** Bahasa Indonesia message for an unexpected (non-AppError) failure. */
  errorMessage: string
  /** Parse the uploaded bytes. Throws an AppError on bad input. */
  parse: (bytes: Uint8Array) => P
  /** Persist the parsed result inside the upload transaction. */
  persist: (tx: Prisma.TransactionClient, parsed: P) => Promise<void>
}

/**
 * Run the shared `.xlsx` upload pipeline for one dataset.
 *
 * This is the single seam every upload pipeline passes through: it gates
 * on the UPLOADER role, reads the FormData file, parses, then runs
 * `persist` and the history write inside one transaction — so a mid-write
 * failure rolls back and leaves the prior dataset intact. A parse failure
 * happens before the transaction opens, so it likewise leaves existing
 * data untouched. Every attempt — success or failure — is recorded in
 * `BudgetUploadHistory` under `config.kind`.
 *
 * Callers wrap this in a module-scope `createServerFn().handler()` so the
 * TanStack Start compiler can strip the server-only body from the client
 * bundle — see the upload files in this folder for the pattern.
 */
export async function runUpload<P extends ParsedUpload>(
  config: UploadConfig<P>,
  data: FormData,
): Promise<UploadResult> {
  const user = await getSessionUser()
  if (!user || user.role !== UserRole.UPLOADER) {
    return {
      ok: false,
      error: 'Anda tidak memiliki akses untuk mengunggah data.',
    }
  }

  const fileEntry = data.get('file')
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null
  if (!file) {
    return { ok: false, error: 'Tidak ada berkas yang dipilih.' }
  }

  const fileName = file.name
  const { kind, logLabel } = config
  logger.info({ fileName, kind }, `${logLabel} upload started`)

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const parsed = config.parse(bytes)
    const rowCount = parsed.rows.length

    await prisma.$transaction(async (tx) => {
      await config.persist(tx, parsed)
      await tx.budgetUploadHistory.create({
        data: {
          kind,
          fileName,
          rowCount,
          status: 'SUCCESS',
          message:
            parsed.warnings.length > 0
              ? `${parsed.warnings.length} baris dilewati saat pemrosesan.`
              : null,
        },
      })
    })

    for (const warning of parsed.warnings) {
      logger.warn({ fileName, kind }, warning)
    }
    logger.info({ fileName, kind, rowCount }, `${logLabel} upload succeeded`)
    return { ok: true, rowCount, warnings: parsed.warnings }
  } catch (error) {
    logger.error({ fileName, kind, err: error }, `${logLabel} upload failed`)
    const message =
      error instanceof AppError ? error.message : config.errorMessage
    // Best-effort: record the failed attempt. A failure here (e.g. the
    // database is unreachable) must not mask the original error.
    try {
      await prisma.budgetUploadHistory.create({
        data: { kind, fileName, rowCount: 0, status: 'FAILED', message },
      })
    } catch (historyError) {
      logger.error(
        { fileName, kind, err: historyError },
        'failed to record upload history',
      )
    }
    return { ok: false, error: message }
  }
}
