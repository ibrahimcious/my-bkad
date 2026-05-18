import { formatIDR } from '@/shared/lib/format'

import type { BudgetLineAggregate } from '../server/aggregations'
import type { SubKegiatanDetailResult } from '../server/aggregate-sub-kegiatan'
import { serapanColor } from './serapan-color'

interface SubKegiatanDetailProps {
  detail: SubKegiatanDetailResult
}

/**
 * A leaf rekening is one no other rekening nests under — i.e. no other
 * code begins with `<kode>.`. Leaves are the most granular ("longest")
 * belanja lines; the shorter parent codes are just rolled-up subtotals.
 */
function leafRekening(rekening: BudgetLineAggregate[]): BudgetLineAggregate[] {
  return rekening.filter(
    (line) => !rekening.some((other) => other.kode.startsWith(`${line.kode}.`)),
  )
}

/**
 * Detail view for a single Sub Kegiatan: a header with its rolled-up
 * totals, then a table of the leaf-level Rekening belanja lines — the
 * most detailed entries, without the intermediate subtotal rows. The
 * table scrolls horizontally on narrow screens.
 */
export function SubKegiatanDetail({ detail }: SubKegiatanDetailProps) {
  const { subKegiatan, subBidang, rekening } = detail

  if (!subKegiatan) {
    return (
      <div className="rounded-card border border-fog bg-snow p-6 text-center sm:p-10">
        <p className="text-sm text-steel">Sub Kegiatan tidak ditemukan.</p>
      </div>
    )
  }

  const lines = leafRekening(rekening)

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-fog bg-snow p-4 sm:p-6">
        <p className="text-xs tabular-nums text-steel">{subKegiatan.kode}</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-obsidian sm:text-xl">
          {subKegiatan.uraian}
        </h1>
        <p className="mt-1 text-sm text-steel">
          Sub Bidang: {subBidang ?? 'Belum ditetapkan'}
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-steel">Anggaran Belanja</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-obsidian">
              {formatIDR(subKegiatan.totalAnggaran)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-steel">Realisasi Belanja</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-obsidian">
              {formatIDR(subKegiatan.totalRealisasi)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-steel">Serapan</dt>
            <dd
              className={`mt-1 text-lg font-bold tabular-nums ${serapanColor(subKegiatan.persentaseSerapan)}`}
            >
              {subKegiatan.persentaseSerapan.toFixed(2)}%
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-card border border-fog bg-snow p-4 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight text-obsidian">
          Rincian Belanja per Rekening
        </h2>
        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-steel">
            Tidak ada rincian belanja untuk Sub Kegiatan ini.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-fog text-steel">
                  <th className="py-1.5 pr-4 font-medium">Uraian Belanja</th>
                  <th className="py-1.5 pr-4 font-medium whitespace-nowrap">
                    Anggaran
                  </th>
                  <th className="py-1.5 pr-4 font-medium whitespace-nowrap">
                    Realisasi
                  </th>
                  <th className="py-1.5 pr-4 font-medium whitespace-nowrap">
                    Serapan
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.kode} className="border-b border-fog">
                    <td className="py-1.5 pr-4 text-ink">{line.uraian}</td>
                    <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap text-ink">
                      {formatIDR(line.totalAnggaran)}
                    </td>
                    <td className="py-1.5 pr-4 tabular-nums whitespace-nowrap text-ink">
                      {formatIDR(line.totalRealisasi)}
                    </td>
                    <td
                      className={`py-1.5 pr-4 tabular-nums whitespace-nowrap font-medium ${serapanColor(line.persentaseSerapan)}`}
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
    </div>
  )
}
