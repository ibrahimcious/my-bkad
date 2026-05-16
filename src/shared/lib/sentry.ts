import * as Sentry from '@sentry/node'

/**
 * Sentry error tracking (server-side).
 *
 * The production process initialises Sentry in `server.js` so its global
 * handlers are installed before the app loads. This module exposes the
 * same configuration for any other entry point, plus `captureException`
 * for reporting an error explicitly from server code.
 *
 * Sentry is a no-op when `SENTRY_DSN` is unset, so development, tests,
 * and CI are unaffected.
 *
 * Data-residency note: Sentry's SaaS ingests events outside Indonesia.
 * Error payloads can contain request fragments — keep sensitive values
 * (credentials, session contents) out of error messages. See docs/deploy.md.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0,
  })
}

/** Report an error to Sentry. No-op when Sentry is not configured. */
export function captureException(error: unknown): void {
  if (!process.env.SENTRY_DSN) return
  Sentry.captureException(error)
}
