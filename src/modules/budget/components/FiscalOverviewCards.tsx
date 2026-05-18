import { formatIDR } from '@/shared/lib/format'

import type { FiscalOverview } from '../server/aggregate-fiscal-overview'

interface FiscalOverviewCardsProps {
  overview: FiscalOverview
}

/** Percentage of a target reached, as a display string. */
function percentLabel(realisasi: number, anggaran: number): string {
  return anggaran > 0
    ? `${((realisasi / anggaran) * 100).toFixed(2)}%`
    : '—'
}

/**
 * The three headline cards of the dashboard overview: Pendapatan,
 * Belanja, and the Surplus/Defisit between them. All three come from
 * the same LRA file, so the Surplus is the figure the LRA reports.
 */
export function FiscalOverviewCards({ overview }: FiscalOverviewCardsProps) {
  const { pendapatan, belanja } = overview
  const surplus = pendapatan.realisasi - belanja.realisasi
  const isSurplus = surplus >= 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">Pendapatan</p>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
          {formatIDR(pendapatan.realisasi)}
        </p>
        <p className="mt-1 text-xs text-steel">
          dari {formatIDR(pendapatan.anggaran)} ·{' '}
          {percentLabel(pendapatan.realisasi, pendapatan.anggaran)}
        </p>
      </div>
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">Belanja</p>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
          {formatIDR(belanja.realisasi)}
        </p>
        <p className="mt-1 text-xs text-steel">
          dari {formatIDR(belanja.anggaran)} ·{' '}
          {percentLabel(belanja.realisasi, belanja.anggaran)}
        </p>
      </div>
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">{isSurplus ? 'Surplus' : 'Defisit'}</p>
        <p
          className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${
            isSurplus ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatIDR(Math.abs(surplus))}
        </p>
        <p className="mt-1 text-xs text-steel">
          Realisasi Pendapatan − Belanja
        </p>
      </div>
    </div>
  )
}
