import { formatIDR } from '@/shared/lib/format'

import type { SubBidangAggregate } from '../server/aggregations'

interface SubBidangTableProps {
  rows: SubBidangAggregate[]
}

/** Dashboard section: budget realisation totalled per Sub Bidang. */
export function SubBidangTable({ rows }: SubBidangTableProps) {
  return (
    <div className="rounded-card border border-fog bg-snow p-6">
      <h2 className="text-sm font-semibold tracking-tight text-obsidian">
        Realisasi per Sub Bidang
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-steel">Tidak ada data.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-fog text-left text-steel">
                <th className="py-2 pr-4 font-medium">Sub Bidang</th>
                <th className="py-2 pl-4 text-right font-medium">Anggaran</th>
                <th className="py-2 pl-4 text-right font-medium">Realisasi</th>
                <th className="py-2 pl-4 text-right font-medium">Serapan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.subBidang} className="border-b border-fog">
                  <td className="py-2 pr-4 text-ink">{row.subBidang}</td>
                  <td className="py-2 pl-4 text-right tabular-nums text-ink">
                    {formatIDR(row.totalAnggaran)}
                  </td>
                  <td className="py-2 pl-4 text-right tabular-nums text-ink">
                    {formatIDR(row.totalRealisasi)}
                  </td>
                  <td className="py-2 pl-4 text-right font-medium tabular-nums text-obsidian">
                    {row.persentaseSerapan.toFixed(2)}%
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
