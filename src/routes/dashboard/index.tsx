import { createFileRoute } from '@tanstack/react-router'

import {
  BudgetLineTable,
  KelompokBelanjaChart,
  SerapanRanking,
  SummaryCards,
  getBudgetByKelompok,
  getBudgetSummary,
  getSubKegiatanLines,
  getTopPrograms,
} from '@/modules/budget'
import { formatDateID } from '@/shared/lib/format'

export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    const [summary, byKelompok, topPrograms, subKegiatan] = await Promise.all([
      getBudgetSummary(),
      getBudgetByKelompok(),
      getTopPrograms(),
      getSubKegiatanLines(),
    ])
    return { summary, byKelompok, topPrograms, subKegiatan }
  },
  component: DashboardPage,
  pendingComponent: DashboardPending,
})

function DashboardPage() {
  const { summary, byKelompok, topPrograms, subKegiatan } =
    Route.useLoaderData()

  // A null timestamp means no LRA has been uploaded yet.
  if (summary.lastUpdatedAt === null) {
    return (
      <div className="rounded-card border border-fog bg-snow p-10 text-center">
        <p className="text-sm text-steel">
          Belum ada data LRA. Silakan unggah berkas pada halaman administrasi.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-obsidian">
          Ringkasan Realisasi Anggaran
        </h1>
        <p className="mt-1 text-sm text-steel">
          Terakhir diperbarui:{' '}
          {formatDateID(new Date(summary.lastUpdatedAt))}
        </p>
      </div>

      <SummaryCards summary={summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <KelompokBelanjaChart data={byKelompok} />
        </div>
        <div className="lg:col-span-2">
          <SerapanRanking
            highest={topPrograms.highestSerapan}
            lowest={topPrograms.lowestSerapan}
          />
        </div>
      </div>

      <BudgetLineTable
        title="Program dengan Anggaran Terbesar"
        nameLabel="Program"
        lines={topPrograms.byAnggaran}
      />

      <BudgetLineTable
        title="Rincian Anggaran dan Realisasi per Sub Kegiatan"
        nameLabel="Sub Kegiatan"
        lines={subKegiatan}
      />
    </div>
  )
}

function DashboardPending() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-72 animate-pulse rounded-card bg-fog" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-card bg-fog" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="h-80 animate-pulse rounded-card bg-fog lg:col-span-3" />
        <div className="h-80 animate-pulse rounded-card bg-fog lg:col-span-2" />
      </div>
      <div className="h-64 animate-pulse rounded-card bg-fog" />
      <div className="h-96 animate-pulse rounded-card bg-fog" />
    </div>
  )
}
