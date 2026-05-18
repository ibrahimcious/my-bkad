import { formatIDR } from '@/shared/lib/format'

import type { FiscalOverview } from '../server/aggregate-fiscal-overview'

interface FiscalOverviewCardsProps {
  overview: FiscalOverview
}

/**
 * The three headline cards of the APBD overview, all on a budget
 * (Anggaran) basis — the three components of the APBD: Pendapatan,
 * Belanja, and Pembiayaan. Realisation is shown in the chart below, not
 * on the cards, so the two readings stay distinct.
 */
export function FiscalOverviewCards({ overview }: FiscalOverviewCardsProps) {
  const cards = [
    { label: 'Anggaran Pendapatan', value: overview.pendapatan.anggaran },
    { label: 'Anggaran Belanja', value: overview.belanja.anggaran },
    { label: 'Anggaran Pembiayaan', value: overview.pembiayaan.anggaran },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-card border border-fog bg-snow p-6"
        >
          <p className="text-sm text-steel">{card.label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
            {formatIDR(card.value)}
          </p>
        </div>
      ))}
    </div>
  )
}
