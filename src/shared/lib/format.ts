/**
 * Shared formatting helpers. All currency and date display in the app
 * goes through these — never inline `Intl.NumberFormat` or
 * `Intl.DateTimeFormat` in components.
 *
 * First-pass implementations for U1. Formatting details (compact
 * notation for large figures, negative/zero handling) are finalized
 * alongside the dashboard UI in U5.
 */

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Format a number as Indonesian Rupiah, e.g. `1234567` -> `"Rp 1.234.567"`.
 * Rupiah is displayed without fraction digits.
 */
export function formatIDR(value: number): string {
  return idrFormatter.format(value)
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/**
 * Format a date in Bahasa Indonesia as `DD MMMM YYYY`,
 * e.g. `new Date('2026-05-15')` -> `"15 Mei 2026"`.
 */
export function formatDateID(date: Date): string {
  return dateFormatter.format(date)
}
