import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

/**
 * Liveness/readiness probe. Issues a trivial query; if the database is
 * unreachable the query throws, the loader fails, and the route responds
 * with a 5xx — so an uptime monitor or container healthcheck can rely on
 * the status code alone.
 */
const checkHealth = createServerFn({ method: 'GET' }).handler(async () => {
  await prisma.$queryRaw`SELECT 1`
  return { status: 'ok' as const }
})

export const Route = createFileRoute('/healthz')({
  loader: () => checkHealth(),
  component: HealthCheck,
})

function HealthCheck() {
  const { status } = Route.useLoaderData()
  return <pre>{status}</pre>
}
