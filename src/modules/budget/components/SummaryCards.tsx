import { formatIDR } from '@/shared/lib/format'

import type { BudgetSummary } from '../server/aggregations'

interface SummaryCardsProps {
  summary: BudgetSummary
}

/**
 * Three big-number cards: total Anggaran, total Realisasi, % Serapan.
 * The % Serapan card uses the dark surface — the one obsidian panel on
 * the dashboard, drawing the eye to the headline metric.
 */
export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: 'Total Anggaran', value: formatIDR(summary.totalAnggaran), dark: false },
    { label: 'Total Realisasi', value: formatIDR(summary.totalRealisasi), dark: false },
    {
      label: 'Persentase Serapan',
      value: `${summary.persentaseSerapan.toFixed(2)}%`,
      dark: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={
            card.dark
              ? 'rounded-card bg-obsidian p-6'
              : 'rounded-card border border-fog bg-snow p-6'
          }
        >
          <p className={card.dark ? 'text-sm text-ash' : 'text-sm text-steel'}>
            {card.label}
          </p>
          <p
            className={`mt-3 text-2xl font-bold tracking-tight tabular-nums ${
              card.dark ? 'text-snow' : 'text-obsidian'
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
