import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton. Instantiating a new PrismaClient on every
 * import would exhaust database connections during dev HMR, so the
 * instance is cached on globalThis outside production.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
