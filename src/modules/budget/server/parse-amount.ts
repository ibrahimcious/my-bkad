/**
 * Parse a monetary cell from an LRA Excel export.
 *
 * SIPD reports are not consistent about how amounts are stored. The
 * belanja "Per Program" recap writes them as **text** in Indonesian
 * locale (`"36.387.492.566,45"` — `.` thousands, `,` decimal); the
 * Pendapatan LRA writes them as **native numbers**. This helper accepts
 * both, plus `"0,00"`, empty / dash (`"-"`) cells, and accounting-style
 * `"(...)"` negatives.
 *
 * Returns `0` for an empty or dash cell, and `null` when a non-empty
 * cell cannot be read as a number — so the caller can skip the row
 * instead of silently importing a zero.
 */
export function parseAmount(cell: unknown): number | null {
  if (cell == null) return 0
  if (typeof cell === 'number') return Number.isFinite(cell) ? cell : null
  if (typeof cell !== 'string') return null

  let text = cell.trim()
  if (text === '' || text === '-') return 0

  let sign = 1
  // Accounting-style negatives: "(1.234,00)".
  if (text.startsWith('(') && text.endsWith(')')) {
    sign = -1
    text = text.slice(1, -1).trim()
  } else if (text.startsWith('-')) {
    sign = -1
    text = text.slice(1).trim()
  }

  // Drop the "." thousands separators, then make "," the decimal point.
  const normalized = text.replace(/\./g, '').replace(',', '.')
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null

  const value = Number(normalized)
  return Number.isFinite(value) ? sign * value : null
}
