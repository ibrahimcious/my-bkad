import { describe, expect, it } from 'vitest'

import { formatDateID, formatIDR } from '@/shared/lib/format'

// Intl separates the "Rp" symbol from the amount with a non-breaking
// space (U+00A0), not a regular space — assertions must match it.
const NBSP = '\u00A0'

describe('formatIDR', () => {
  it('formats a number as Rupiah with thousands separators', () => {
    expect(formatIDR(1234567)).toBe(`Rp${NBSP}1.234.567`)
  })

  it('formats zero without fraction digits', () => {
    expect(formatIDR(0)).toBe(`Rp${NBSP}0`)
  })
})

describe('formatDateID', () => {
  it('formats a date as DD MMMM YYYY in Bahasa Indonesia', () => {
    expect(formatDateID(new Date('2026-05-15'))).toBe('15 Mei 2026')
  })

  it('zero-pads single-digit days', () => {
    expect(formatDateID(new Date('2026-05-05'))).toBe('05 Mei 2026')
  })
})
