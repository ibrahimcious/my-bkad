/**
 * Shared formatting helpers. All currency and date display in the app
 * goes through these — never inline `Intl.NumberFormat` or
 * `Intl.DateTimeFormat` in components.
 *
 */

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Format a number as Indonesian Rupiah, e.g. `1234567` -> `"Rp 1.234.567"`.
 * Rupiah is displayed without fraction digits. Use this for precise
 * figures — tables, tooltips, summary cards.
 */
export function formatIDR(value: number): string {
  return idrFormatter.format(value)
}

const idrCompactFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/**
 * Format a number as compact Indonesian Rupiah, e.g. `668220378293` ->
 * `"Rp 668,2 M"`. Use this only where space is tight and precision is
 * not required, such as chart axis ticks — never for figures the user
 * needs to read exactly.
 */
export function formatIDRCompact(value: number): string {
  return idrCompactFormatter.format(value)
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
