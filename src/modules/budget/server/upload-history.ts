import { UploadKind } from '@prisma/client'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { prisma } from '@/shared/db'

/** How many recent upload records the admin page shows. */
const HISTORY_LIMIT = 20

/**
 * The most recent upload attempts of a given kind, newest first. One
 * `BudgetUploadHistory` table serves every pipeline, discriminated by
 * `kind`; each admin upload page passes its own kind.
 */
export const getUploadHistory = createServerFn({ method: 'GET' })
  .inputValidator((kind: unknown) => z.enum(UploadKind).parse(kind))
  .handler(({ data: kind }) =>
    prisma.budgetUploadHistory.findMany({
      where: { kind },
      orderBy: { uploadedAt: 'desc' },
      take: HISTORY_LIMIT,
    }),
  )
