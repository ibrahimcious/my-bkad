import { formatIDR } from '@/shared/lib/format'

import type { BudgetSummary } from '../server/aggregations'

interface SummaryCardsProps {
  summary: BudgetSummary
}

/** Three big-number cards: total Anggaran, total Realisasi, % Serapan. */
export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: 'Total Anggaran Belanja', value: formatIDR(summary.totalAnggaran) },
    {
      label: 'Total Realisasi Belanja',
      value: formatIDR(summary.totalRealisasi),
    },
    {
      label: 'Persentase Serapan',
      value: `${summary.persentaseSerapan.toFixed(2)}%`,
    },
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
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
