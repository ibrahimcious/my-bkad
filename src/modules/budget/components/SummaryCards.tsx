import { formatIDR } from '@/shared/lib/format'

import type { BudgetSummary } from '../server/aggregations'

interface SummaryCardsProps {
  summary: BudgetSummary
}

/** Three big-number cards: total Anggaran, total Realisasi, % Serapan. */
export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: 'Total Anggaran', value: formatIDR(summary.totalAnggaran) },
    { label: 'Total Realisasi', value: formatIDR(summary.totalRealisasi) },
    {
      label: 'Persentase Serapan',
      value: `${summary.persentaseSerapan.toFixed(2)}%`,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
