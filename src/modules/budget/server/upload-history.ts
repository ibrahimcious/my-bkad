import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

/** How many recent upload records the admin page shows. */
const HISTORY_LIMIT = 20

/**
 * Return the most recent LRA upload attempts, newest first. Used by the
 * admin upload page to show a history of refreshes.
 */
export const getUploadHistory = createServerFn({ method: 'GET' }).handler(
  () => {
    return prisma.budgetUploadHistory.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: HISTORY_LIMIT,
    })
  },
)
