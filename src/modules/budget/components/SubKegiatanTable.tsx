import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { formatIDR } from '@/shared/lib/format'

import type { SubKegiatanLine } from '../server/aggregations'
import { serapanColor } from './serapan-color'

type SortKey = 'anggaran' | 'realisasi' | 'serapan'

const NUMERIC_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'anggaran', label: 'Anggaran' },
  { key: 'realisasi', label: 'Realisasi' },
  { key: 'serapan', label: 'Serapan' },
]

/** The sortable value for a column, read off a Sub Kegiatan row. */
function lineValue(line: SubKegiatanLine, key: SortKey): number {
  if (key === 'anggaran') return line.totalAnggaran
  if (key === 'realisasi') return line.totalRealisasi
  return line.persentaseSerapan
}

interface SubKegiatanTableProps {
  lines: SubKegiatanLine[]
}

/**
 * Flat, compact Sub Kegiatan table — one row per Sub Kegiatan, with its
 * Sub Bidang as a plain column. Anggaran, Realisasi and Serapan are
 * sortable (a header click cycles desc → asc → off). Clicking a row
 * opens that Sub Kegiatan's belanja detail page.
 */
export function SubKegiatanTable({ lines }: SubKegiatanTableProps) {
  const navigate = useNavigate()
  const [sort, setSort] = useState<{
    key: SortKey
    dir: 'asc' | 'desc'
  } | null>(null)

  function cycleSort(key: SortKey) {
    setSort((cur) => {
      if (!cur || cur.key !== key) return { key, dir: 'desc' }
      if (cur.dir === 'desc') return { key, dir: 'asc' }
      return null
    })
  }

  const rows = sort
    ? [...lines].sort((a, b) => {
        const diff = lineValue(a, sort.key) - lineValue(b, sort.key)
        return sort.dir === 'asc' ? diff : -diff
      })
    : lines

  return (
    <div className="rounded-card border border-fog bg-snow p-6">
      <h2 className="text-sm font-semibold tracking-tight text-obsidian">
        Rincian Anggaran dan Realisasi per Sub Kegiatan
      </h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-steel">Tidak ada data.</p>
      ) : (
        <div className="mt-4 max-h-[640px] overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-snow">
              <tr className="border-b border-fog text-steel">
                <th className="py-1.5 pr-4 font-medium">Sub Kegiatan</th>
                <th className="py-1.5 pr-4 font-medium">Sub Bidang</th>
                {NUMERIC_COLUMNS.map((column) => (
                  <th key={column.key} className="py-1.5 pr-4 font-medium">
                    <button
                      type="button"
                      onClick={() => cycleSort(column.key)}
                      className="transition-colors hover:text-obsidian"
                    >
                      {column.label}
                      {sort?.key === column.key
                        ? sort.dir === 'asc'
                          ? ' ↑'
                          : ' ↓'
                        : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((line) => (
                <tr
                  key={line.kode}
                  onClick={() =>
                    navigate({
                      to: '/dashboard/sub-kegiatan/$kode',
                      params: { kode: line.kode },
                    })
                  }
                  className="cursor-pointer border-b border-fog transition-colors hover:bg-mist"
                >
                  <td className="py-1.5 pr-4 text-ink">{line.uraian}</td>
                  <td className="py-1.5 pr-4 text-steel">{line.subBidang}</td>
                  <td className="py-1.5 pr-4 tabular-nums text-ink">
                    {formatIDR(line.totalAnggaran)}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums text-ink">
                    {formatIDR(line.totalRealisasi)}
                  </td>
                  <td
                    className={`py-1.5 pr-4 tabular-nums font-medium ${serapanColor(line.persentaseSerapan)}`}
                  >
                    {line.persentaseSerapan.toFixed(2)}%
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
