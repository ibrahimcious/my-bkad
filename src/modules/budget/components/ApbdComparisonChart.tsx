import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatIDR, formatIDRCompact } from '@/shared/lib/format'

import type { FiscalOverview } from '../server/aggregate-fiscal-overview'

interface ApbdComparisonChartProps {
  overview: FiscalOverview
}

/** Realisation as a percentage of a target, guarding a zero target. */
function percentOf(realisasi: number, anggaran: number): number {
  return anggaran > 0 ? (realisasi / anggaran) * 100 : 0
}

/**
 * Grouped bar chart comparing Anggaran and Realisasi for Pendapatan and
 * Belanja side by side — the headline visual of the APBD overview.
 * Each Realisasi bar is labelled with its realisation percentage.
 */
export function ApbdComparisonChart({ overview }: ApbdComparisonChartProps) {
  const data = [
    {
      label: 'Pendapatan',
      anggaran: overview.pendapatan.anggaran,
      realisasi: overview.pendapatan.realisasi,
      persen: percentOf(
        overview.pendapatan.realisasi,
        overview.pendapatan.anggaran,
      ),
    },
    {
      label: 'Belanja',
      anggaran: overview.belanja.anggaran,
      realisasi: overview.belanja.realisasi,
      persen: percentOf(overview.belanja.realisasi, overview.belanja.anggaran),
    },
  ]
  const isEmpty = data.every((d) => d.anggaran === 0 && d.realisasi === 0)

  return (
    <div className="rounded-card border border-fog bg-snow p-6">
      <h2 className="text-sm font-semibold tracking-tight text-obsidian">
        Perbandingan Anggaran dan Realisasi
      </h2>
      {isEmpty ? (
        <div className="mt-4 flex h-72 items-center justify-center">
          <p className="text-sm text-steel">Belum ada data.</p>
        </div>
      ) : (
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barGap={8}
              barCategoryGap="32%"
              margin={{ top: 24, right: 8, bottom: 0, left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#ececee"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#ececee' }}
                tick={{ fontSize: 12, fill: '#71717a' }}
                dy={4}
              />
              <YAxis
                tickFormatter={formatIDRCompact}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#71717a' }}
                width={72}
              />
              <Tooltip
                cursor={{ fill: 'rgba(9, 9, 11, 0.04)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #ececee',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(9, 9, 11, 0.08)',
                }}
                labelStyle={{ color: '#09090b', fontWeight: 600 }}
                formatter={(value, name) => {
                  const amount =
                    typeof value === 'number' ? value : Number(value) || 0
                  return [formatIDR(amount), name]
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              <Bar
                dataKey="anggaran"
                name="Anggaran"
                fill="var(--color-chart-2)"
                radius={[6, 6, 0, 0]}
                maxBarSize={64}
              />
              <Bar
                dataKey="realisasi"
                name="Realisasi"
                fill="var(--color-chart-1)"
                radius={[6, 6, 0, 0]}
                maxBarSize={64}
              >
                <LabelList
                  dataKey="persen"
                  position="top"
                  fill="#3f3f46"
                  fontSize={11}
                  fontWeight={600}
                  formatter={(value) => `${Math.round(Number(value) || 0)}%`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
