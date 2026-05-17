import { useState } from 'react'

import { formatIDR } from '@/shared/lib/format'

import type { BudgetLineAggregate } from '../server/aggregations'

interface BudgetLineTableProps {
  /** Heading shown above the table. */
  title: string
  /** Header label for the description column (e.g. "Program"). */
  nameLabel: string
  lines: Array<BudgetLineAggregate & { subBidang?: string }>
  /** When true, renders a Sub Bidang column between the name and numeric cols. */
  showSubBidang?: boolean
}

type SortKey = 'totalAnggaran' | 'totalRealisasi' | 'persentaseSerapan'

const NUMERIC_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'totalAnggaran', label: 'Anggaran' },
  { key: 'totalRealisasi', label: 'Realisasi' },
  { key: 'persentaseSerapan', label: 'Serapan' },
]

/** A sortable table of budget lines (programs, sub kegiatan, etc.). */
export function BudgetLineTable({ title, nameLabel, lines, showSubBidang }: BudgetLineTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalAnggaran')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = [...lines].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return sortDir === 'asc' ? diff : -diff
  })

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="rounded-card border border-fog bg-snow p-6">
      <h2 className="text-sm font-semibold tracking-tight text-obsidian">
        {title}
      </h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-steel">Tidak ada data.</p>
      ) : (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-fog text-left text-steel">
              <th className="py-2 pr-4 font-medium">Kode</th>
              <th className="py-2 pr-4 font-medium">{nameLabel}</th>
              {showSubBidang && (
                <th className="py-2 pr-4 font-medium">Sub Bidang</th>
              )}
              {NUMERIC_COLUMNS.map((column) => (
                <th key={column.key} className="py-2 pl-4 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="transition-colors hover:text-obsidian"
                  >
                    {column.label}
                    {sortKey === column.key
                      ? sortDir === 'asc'
                        ? ' ↑'
                        : ' ↓'
                      : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((line) => (
              <tr key={line.kode} className="border-b border-fog">
                <td className="py-2 pr-4 tabular-nums text-steel">{line.kode}</td>
                <td className="py-2 pr-4 text-ink">{line.uraian}</td>
                {showSubBidang && (
                  <td className="py-2 pr-4 text-steel">{line.subBidang ?? '—'}</td>
                )}
                <td className="py-2 pl-4 text-right tabular-nums text-ink">
                  {formatIDR(line.totalAnggaran)}
                </td>
                <td className="py-2 pl-4 text-right tabular-nums text-ink">
                  {formatIDR(line.totalRealisasi)}
                </td>
                <td className="py-2 pl-4 text-right font-medium tabular-nums text-obsidian">
                  {line.persentaseSerapan.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
