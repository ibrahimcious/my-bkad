import { useNavigate } from '@tanstack/react-router'

import { formatIDR } from '@/shared/lib/format'

import type { PendapatanLine } from '../server/pendapatan-aggregations'

interface PendapatanKelompokTableProps {
  rows: PendapatanLine[]
}

/**
 * Pendapatan totalled per Kelompok (PAD, Pendapatan Transfer, …). A
 * table rather than a chart: the kelompok differ by orders of
 * magnitude, so bars would be unreadable. Clicking a row opens that
 * Kelompok's Jenis-level detail.
 */
export function PendapatanKelompokTable({
  rows,
}: PendapatanKelompokTableProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-card border border-fog bg-snow p-6">
      <h2 className="text-sm font-semibold tracking-tight text-obsidian">
        Pendapatan per Kelompok
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-steel">Tidak ada data.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-fog text-steel">
                <th className="py-1.5 pr-4 font-medium">Kelompok</th>
                <th className="py-1.5 pr-4 font-medium whitespace-nowrap">
                  Anggaran
                </th>
                <th className="py-1.5 pr-4 font-medium whitespace-nowrap">
                  Realisasi
                </th>
                <th className="py-1.5 pr-4 font-medium whitespace-nowrap">
                  Capaian
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.kode}
                  onClick={() =>
                    navigate({
                      to: '/dashboard/pendapatan/$kode',
                      params: { kode: row.kode },
                    })
                  }
                  className="cursor-pointer border-b border-fog transition-colors hover:bg-mist"
                >
                  <td className="py-1.5 pr-4 text-ink">{row.uraian}</td>
                  <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap text-ink">
                    {formatIDR(row.anggaran)}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap text-ink">
                    {formatIDR(row.realisasi)}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap font-medium text-obsidian">
                    {row.persentaseCapaian.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
