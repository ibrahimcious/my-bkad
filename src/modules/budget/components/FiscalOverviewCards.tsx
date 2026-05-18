import { formatIDR } from '@/shared/lib/format'

import type { FiscalOverview } from '../server/aggregate-fiscal-overview'

interface FiscalOverviewCardsProps {
  overview: FiscalOverview
}

/**
 * The three headline cards of the APBD overview, all on a budget
 * (Anggaran) basis: Pendapatan, Belanja, and the budgeted
 * Surplus/Defisit between them. Realisation is shown in the chart
 * below — not on the cards — so the two readings stay distinct.
 */
export function FiscalOverviewCards({ overview }: FiscalOverviewCardsProps) {
  const surplus = overview.pendapatan.anggaran - overview.belanja.anggaran
  const isSurplus = surplus >= 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">Anggaran Pendapatan</p>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
          {formatIDR(overview.pendapatan.anggaran)}
        </p>
      </div>
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">Anggaran Belanja</p>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
          {formatIDR(overview.belanja.anggaran)}
        </p>
      </div>
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">
          {isSurplus ? 'Surplus Anggaran' : 'Defisit Anggaran'}
        </p>
        <p
          className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${
            isSurplus ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatIDR(Math.abs(surplus))}
        </p>
      </div>
    </div>
  )
}
