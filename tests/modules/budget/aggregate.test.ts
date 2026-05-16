import { describe, expect, it } from 'vitest'

import {
  type BudgetAmounts,
  type ProgramAggregate,
  breakdownByKelompok,
  rankPrograms,
  serapanPercent,
  summarizeBudget,
} from '@/modules/budget/server/aggregations'

// UNSUR fixture: totalAnggaran 1000, totalRealisasi 480 (48% serapan).
const unsur: BudgetAmounts = {
  anggaranOperasi: 100,
  realisasiOperasi: 50,
  anggaranModal: 200,
  realisasiModal: 80,
  anggaranTakTerduga: 0,
  realisasiTakTerduga: 0,
  anggaranTransfer: 700,
  realisasiTransfer: 350,
}

function program(
  kode: string,
  totalAnggaran: number,
  persentaseSerapan: number,
): ProgramAggregate {
  return {
    kode,
    uraian: `Program ${kode}`,
    totalAnggaran,
    totalRealisasi: (totalAnggaran * persentaseSerapan) / 100,
    persentaseSerapan,
  }
}

describe('serapanPercent', () => {
  it('computes realisasi as a percentage of anggaran', () => {
    expect(serapanPercent(200, 100)).toBe(50)
  })

  it('returns 0 — not NaN — when there is no budget', () => {
    expect(serapanPercent(0, 0)).toBe(0)
  })
})

describe('summarizeBudget', () => {
  it('totals the UNSUR row and computes serapan', () => {
    const date = new Date('2026-05-12T00:00:00Z')
    expect(summarizeBudget(unsur, date)).toEqual({
      totalAnggaran: 1000,
      totalRealisasi: 480,
      persentaseSerapan: 48,
      lastUpdatedAt: date,
    })
  })

  it('yields zeros and a null timestamp for an empty budget table', () => {
    expect(summarizeBudget(null, null)).toEqual({
      totalAnggaran: 0,
      totalRealisasi: 0,
      persentaseSerapan: 0,
      lastUpdatedAt: null,
    })
  })
})

describe('breakdownByKelompok', () => {
  it('returns the four groups with per-group serapan', () => {
    const result = breakdownByKelompok(unsur)
    expect(result.map((g) => g.kelompok)).toEqual([
      'Operasi',
      'Modal',
      'Tak Terduga',
      'Transfer',
    ])
    expect(result[1]).toEqual({
      kelompok: 'Modal',
      anggaran: 200,
      realisasi: 80,
      persentaseSerapan: 40,
    })
  })

  it('returns four zero entries for an empty budget table', () => {
    const result = breakdownByKelompok(null)
    expect(result).toHaveLength(4)
    expect(result.every((g) => g.anggaran === 0 && g.realisasi === 0)).toBe(
      true,
    )
  })
})

describe('rankPrograms', () => {
  const programs = [
    program('A', 1000, 30),
    program('B', 3000, 80),
    program('C', 2000, 10),
  ]

  it('ranks by total anggaran, highest first', () => {
    expect(rankPrograms(programs).byAnggaran.map((p) => p.kode)).toEqual([
      'B',
      'C',
      'A',
    ])
  })

  it('ranks serapan highest-first and lowest-first', () => {
    const { highestSerapan, lowestSerapan } = rankPrograms(programs)
    expect(highestSerapan.map((p) => p.kode)).toEqual(['B', 'A', 'C'])
    expect(lowestSerapan.map((p) => p.kode)).toEqual(['C', 'A', 'B'])
  })

  it('caps byAnggaran at the top 10', () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      program(`P${i}`, i * 100, 50),
    )
    expect(rankPrograms(many).byAnggaran).toHaveLength(10)
  })

  it('returns empty rankings for no programs', () => {
    expect(rankPrograms([])).toEqual({
      byAnggaran: [],
      highestSerapan: [],
      lowestSerapan: [],
    })
  })
})
