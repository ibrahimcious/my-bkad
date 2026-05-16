import { useState } from 'react'

import { formatIDR } from '@/shared/lib/format'

import type { BudgetLineAggregate } from '../server/aggregations'

interface BudgetLineTableProps {
  /** Heading shown above the table. */
  title: string
  /** Header label for the description column (e.g. "Program"). */
  nameLabel: string
  lines: BudgetLineAggregate[]
}

type SortKey = 'totalAnggaran' | 'totalRealisasi' | 'persentaseSerapan'

const NUMERIC_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'totalAnggaran', label: 'Anggaran' },
  { key: 'totalRealisasi', label: 'Realisasi' },
  { key: 'persentaseSerapan', label: 'Serapan' },
]

/** A sortable table of budget lines (programs, sub kegiatan, etc.). */
export function BudgetLineTable({ title, nameLabel, lines }: BudgetLineTableProps) {
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
    <div className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Tidak ada data.</p>
      ) : (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Kode</th>
              <th className="py-2 pr-4 font-medium">{nameLabel}</th>
              {NUMERIC_COLUMNS.map((column) => (
                <th key={column.key} className="py-2 pl-4 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="hover:text-foreground"
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
              <tr key={line.kode} className="border-b">
                <td className="py-2 pr-4 tabular-nums">{line.kode}</td>
                <td className="py-2 pr-4">{line.uraian}</td>
                <td className="py-2 pl-4 text-right tabular-nums">
                  {formatIDR(line.totalAnggaran)}
                </td>
                <td className="py-2 pl-4 text-right tabular-nums">
                  {formatIDR(line.totalRealisasi)}
                </td>
                <td className="py-2 pl-4 text-right tabular-nums">
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
