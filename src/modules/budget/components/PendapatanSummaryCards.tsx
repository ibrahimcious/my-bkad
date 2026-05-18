import { formatIDR } from '@/shared/lib/format'

import type { PendapatanSummary } from '../server/pendapatan-aggregations'

interface PendapatanSummaryCardsProps {
  summary: PendapatanSummary
}

/**
 * Three big-number cards for the Pendapatan dashboard: total Anggaran,
 * total Realisasi (with the prior year for comparison), and % capaian.
 */
export function PendapatanSummaryCards({
  summary,
}: PendapatanSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">Total Anggaran Pendapatan</p>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
          {formatIDR(summary.totalAnggaran)}
        </p>
      </div>
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">Total Realisasi Pendapatan</p>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
          {formatIDR(summary.totalRealisasi)}
        </p>
        <p className="mt-1 text-xs text-steel">
          Tahun lalu: {formatIDR(summary.totalRealisasiPrevYear)}
        </p>
      </div>
      <div className="rounded-card border border-fog bg-snow p-6">
        <p className="text-sm text-steel">Capaian</p>
        <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-obsidian">
          {summary.persentaseCapaian.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}
