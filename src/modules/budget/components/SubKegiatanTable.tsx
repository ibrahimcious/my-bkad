import { Fragment, useState } from 'react'

import { formatIDR } from '@/shared/lib/format'

import type { SubKegiatanLine } from '../server/aggregations'

function serapanColor(pct: number): string {
  if (pct >= 85) return 'text-green-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function sumGroup(lines: SubKegiatanLine[]) {
  const anggaran = lines.reduce((s, l) => s + l.totalAnggaran, 0)
  const realisasi = lines.reduce((s, l) => s + l.totalRealisasi, 0)
  const serapan = anggaran > 0 ? (realisasi / anggaran) * 100 : 0
  return { anggaran, realisasi, serapan }
}

interface SubKegiatanTableProps {
  lines: SubKegiatanLine[]
}

/** Sub Kegiatan table grouped by Sub Bidang, with collapsible sections and color-coded Serapan. */
export function SubKegiatanTable({ lines }: SubKegiatanTableProps) {
  const groups = lines.reduce<Map<string, SubKegiatanLine[]>>((map, line) => {
    const group = map.get(line.subBidang) ?? []
    group.push(line)
    map.set(line.subBidang, group)
    return map
  }, new Map())

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggle(subBidang: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(subBidang)) next.delete(subBidang)
      else next.add(subBidang)
      return next
    })
  }

  return (
    <div className="rounded-card border border-fog bg-snow p-6">
      <h2 className="text-sm font-semibold tracking-tight text-obsidian">
        Rincian Anggaran dan Realisasi per Sub Kegiatan
      </h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-steel">Tidak ada data.</p>
      ) : (
        <div className="mt-4 max-h-[640px] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-snow">
              <tr className="border-b border-fog text-left text-steel">
                <th className="py-2 pr-4 font-medium">Kode</th>
                <th className="py-2 pr-4 font-medium">Sub Kegiatan</th>
                <th className="py-2 pl-4 text-right font-medium">Anggaran</th>
                <th className="py-2 pl-4 text-right font-medium">Realisasi</th>
                <th className="py-2 pl-4 text-right font-medium">Serapan</th>
              </tr>
            </thead>
            <tbody>
              {[...groups.entries()].map(([subBidang, groupLines]) => {
                const { anggaran, realisasi, serapan } = sumGroup(groupLines)
                const isCollapsed = collapsed.has(subBidang)
                return (
                  <Fragment key={subBidang}>
                    <tr
                      className="cursor-pointer border-b border-fog bg-mist hover:bg-fog"
                      onClick={() => toggle(subBidang)}
                    >
                      <td colSpan={2} className="py-2 pr-4 font-semibold text-obsidian">
                        <span className="mr-2 text-xs text-steel">
                          {isCollapsed ? '▶' : '▼'}
                        </span>
                        {subBidang}
                      </td>
                      <td className="py-2 pl-4 text-right tabular-nums font-medium text-obsidian">
                        {formatIDR(anggaran)}
                      </td>
                      <td className="py-2 pl-4 text-right tabular-nums font-medium text-obsidian">
                        {formatIDR(realisasi)}
                      </td>
                      <td
                        className={`py-2 pl-4 text-right tabular-nums font-semibold ${serapanColor(serapan)}`}
                      >
                        {serapan.toFixed(2)}%
                      </td>
                    </tr>
                    {!isCollapsed &&
                      groupLines.map((line) => (
                        <tr key={line.kode} className="border-b border-fog">
                          <td className="py-2 pl-6 pr-4 tabular-nums text-steel">{line.kode}</td>
                          <td className="py-2 pr-4 text-ink">{line.uraian}</td>
                          <td className="py-2 pl-4 text-right tabular-nums text-ink">
                            {formatIDR(line.totalAnggaran)}
                          </td>
                          <td className="py-2 pl-4 text-right tabular-nums text-ink">
                            {formatIDR(line.totalRealisasi)}
                          </td>
                          <td
                            className={`py-2 pl-4 text-right tabular-nums font-medium ${serapanColor(line.persentaseSerapan)}`}
                          >
                            {line.persentaseSerapan.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
