import { createFileRoute } from '@tanstack/react-router'

import {
  PendapatanKelompokTable,
  PendapatanSummaryCards,
  getPendapatanByKelompok,
  getPendapatanSummary,
} from '@/modules/budget'
import { formatDateID } from '@/shared/lib/format'

export const Route = createFileRoute('/dashboard/pendapatan')({
  loader: async () => {
    const [summary, byKelompok] = await Promise.all([
      getPendapatanSummary(),
      getPendapatanByKelompok(),
    ])
    return { summary, byKelompok }
  },
  component: PendapatanDashboard,
  pendingComponent: PendapatanPending,
})

function PendapatanDashboard() {
  const { summary, byKelompok } = Route.useLoaderData()

  if (summary.lastUpdatedAt === null) {
    return (
      <div className="rounded-card border border-fog bg-snow p-10 text-center">
        <p className="text-sm text-steel">
          Belum ada data LRA Pendapatan. Silakan unggah berkas pada halaman
          administrasi.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-obsidian">
          Realisasi Pendapatan
        </h1>
        <p className="mt-1 text-sm text-steel">
          Terakhir diperbarui: {formatDateID(new Date(summary.lastUpdatedAt))}
        </p>
      </div>

      <PendapatanSummaryCards summary={summary} />

      <PendapatanKelompokTable rows={byKelompok} />
    </div>
  )
}

function PendapatanPending() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 animate-pulse rounded-card bg-fog" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-card bg-fog" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card bg-fog" />
    </div>
  )
}
