import { Link, createFileRoute } from '@tanstack/react-router'

import {
  PendapatanKelompokDetail,
  getPendapatanKelompokDetail,
} from '@/modules/budget'

/**
 * Detail page for one Kelompok Pendapatan, reached by clicking a row in
 * the Pendapatan dashboard's per-Kelompok table. Shows the Jenis-level
 * breakdown. Auth is inherited from the `/dashboard` layout route.
 */
export const Route = createFileRoute('/dashboard/pendapatan/$kode')({
  loader: async ({ params }) => {
    const detail = await getPendapatanKelompokDetail({ data: params.kode })
    return { detail }
  },
  component: PendapatanKelompokDetailPage,
})

function PendapatanKelompokDetailPage() {
  const { detail } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/pendapatan"
        className="inline-flex text-sm text-steel transition-colors hover:text-obsidian"
      >
        ← Kembali ke Pendapatan
      </Link>
      <PendapatanKelompokDetail detail={detail} />
    </div>
  )
}
