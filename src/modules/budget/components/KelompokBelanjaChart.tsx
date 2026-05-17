import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatIDR, formatIDRCompact } from '@/shared/lib/format'

import type { KelompokBelanjaBreakdown } from '../server/aggregations'

interface KelompokBelanjaChartProps {
  data: KelompokBelanjaBreakdown[]
}

/** Grouped bar chart: Anggaran vs Realisasi per Kelompok Belanja, with % Serapan line. */
export function KelompokBelanjaChart({ data }: KelompokBelanjaChartProps) {
  const isEmpty = data.every((d) => d.anggaran === 0 && d.realisasi === 0)

  return (
    <div className="rounded-card border border-fog bg-snow p-6">
      <h2 className="text-sm font-semibold tracking-tight text-obsidian">
        Anggaran dan Realisasi per Kelompok Belanja
      </h2>
      {isEmpty ? (
        <div className="mt-4 flex h-72 items-center justify-center">
          <p className="text-sm text-steel">Belum ada data.</p>
        </div>
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 48, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececee" />
              <XAxis dataKey="kelompok" tick={{ fontSize: 12, fill: '#71717a' }} />
              <YAxis
                yAxisId="left"
                tickFormatter={formatIDRCompact}
                tick={{ fontSize: 12, fill: '#71717a' }}
                width={80}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 12, fill: '#71717a' }}
                width={44}
              />
              <Tooltip
                formatter={(value, name) => {
                  // Recharts types `value` as ValueType | undefined.
                  const amount =
                    typeof value === 'number' ? value : Number(value) || 0
                  return name === 'Serapan (%)'
                    ? [`${amount.toFixed(2)}%`, name]
                    : [formatIDR(amount), name]
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="anggaran"
                name="Anggaran"
                fill="var(--color-ash)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="realisasi"
                name="Realisasi"
                fill="var(--color-obsidian)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="persentaseSerapan"
                name="Serapan (%)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
