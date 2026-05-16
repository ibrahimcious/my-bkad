import { pino } from 'pino'

/**
 * Application logger. Emits structured JSON. Log messages are written
 * in English; user-facing (Bahasa Indonesia) text belongs in the UI,
 * never in the logs. Never log credentials, password hashes, or raw
 * session contents.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
})
