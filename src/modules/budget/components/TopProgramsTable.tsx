import { useState } from 'react'

import { formatIDR } from '@/shared/lib/format'

import type { ProgramAggregate } from '../server/aggregations'

interface TopProgramsTableProps {
  programs: ProgramAggregate[]
}

type SortKey = 'totalAnggaran' | 'totalRealisasi' | 'persentaseSerapan'

const NUMERIC_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'totalAnggaran', label: 'Anggaran' },
  { key: 'totalRealisasi', label: 'Realisasi' },
  { key: 'persentaseSerapan', label: 'Serapan' },
]

/** Table of top programs by Anggaran; the numeric columns are sortable. */
export function TopProgramsTable({ programs }: TopProgramsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalAnggaran')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = [...programs].sort((a, b) => {
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
      <h2 className="text-sm font-semibold tracking-tight">
        Program dengan Anggaran Terbesar
      </h2>
      {programs.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Tidak ada data program.
        </p>
      ) : (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Kode</th>
              <th className="py-2 pr-4 font-medium">Program</th>
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
            {sorted.map((program) => (
              <tr key={program.kode} className="border-b">
                <td className="py-2 pr-4 tabular-nums">{program.kode}</td>
                <td className="py-2 pr-4">{program.uraian}</td>
                <td className="py-2 pl-4 text-right tabular-nums">
                  {formatIDR(program.totalAnggaran)}
                </td>
                <td className="py-2 pl-4 text-right tabular-nums">
                  {formatIDR(program.totalRealisasi)}
                </td>
                <td className="py-2 pl-4 text-right tabular-nums">
                  {program.persentaseSerapan.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
