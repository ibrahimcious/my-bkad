import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

/** Grouped bar chart: Anggaran vs Realisasi for each Kelompok Belanja. */
export function KelompokBelanjaChart({ data }: KelompokBelanjaChartProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold tracking-tight">
        Anggaran dan Realisasi per Kelompok Belanja
      </h2>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="kelompok" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={formatIDRCompact}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip formatter={(value) => formatIDR(Number(value))} />
            <Legend />
            <Bar
              dataKey="anggaran"
              name="Anggaran"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="realisasi"
              name="Realisasi"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
