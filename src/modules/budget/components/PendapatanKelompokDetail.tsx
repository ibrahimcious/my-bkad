import { formatIDR } from '@/shared/lib/format'

import type { PendapatanKelompokDetailResult } from '../server/aggregate-pendapatan-kelompok-detail'

interface PendapatanKelompokDetailProps {
  detail: PendapatanKelompokDetailResult
}

/**
 * Detail view for a single Kelompok Pendapatan: a header with its
 * rolled-up totals, then a table of the Jenis rows beneath it. The
 * table scrolls horizontally on narrow screens.
 */
export function PendapatanKelompokDetail({
  detail,
}: PendapatanKelompokDetailProps) {
  const { kelompok, jenis } = detail

  if (!kelompok) {
    return (
      <div className="rounded-card border border-fog bg-snow p-6 text-center sm:p-10">
        <p className="text-sm text-steel">
          Kelompok Pendapatan tidak ditemukan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-fog bg-snow p-4 sm:p-6">
        <p className="text-xs tabular-nums text-steel">{kelompok.kode}</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-obsidian sm:text-xl">
          {kelompok.uraian}
        </h1>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-steel">Anggaran</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-obsidian">
              {formatIDR(kelompok.anggaran)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-steel">Realisasi</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-obsidian">
              {formatIDR(kelompok.realisasi)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-steel">Capaian</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-obsidian">
              {kelompok.persentaseCapaian.toFixed(2)}%
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-card border border-fog bg-snow p-4 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight text-obsidian">
          Rincian per Jenis Pendapatan
        </h2>
        {jenis.length === 0 ? (
          <p className="mt-4 text-sm text-steel">
            Tidak ada rincian untuk Kelompok ini.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-fog text-steel">
                  <th className="py-1.5 pr-4 font-medium">Jenis Pendapatan</th>
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
                {jenis.map((line) => (
                  <tr key={line.kode} className="border-b border-fog">
                    <td className="py-1.5 pr-4 text-ink">{line.uraian}</td>
                    <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap text-ink">
                      {formatIDR(line.anggaran)}
                    </td>
                    <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap text-ink">
                      {formatIDR(line.realisasi)}
                    </td>
                    <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap font-medium text-obsidian">
                      {line.persentaseCapaian.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
