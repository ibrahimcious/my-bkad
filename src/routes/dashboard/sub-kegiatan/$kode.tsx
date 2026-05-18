import { Link, createFileRoute } from '@tanstack/react-router'

import { SubKegiatanDetail, getSubKegiatanDetail } from '@/modules/budget'

/**
 * Detail page for one Sub Kegiatan, reached by clicking a row in the
 * dashboard's Sub Kegiatan table. Shows the Rekening-level belanja
 * breakdown. Auth is inherited from the `/dashboard` layout route.
 */
export const Route = createFileRoute('/dashboard/sub-kegiatan/$kode')({
  loader: async ({ params }) => {
    const detail = await getSubKegiatanDetail({ data: params.kode })
    return { detail }
  },
  component: SubKegiatanDetailPage,
})

function SubKegiatanDetailPage() {
  const { detail } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/belanja"
        className="inline-flex text-sm text-steel transition-colors hover:text-obsidian"
      >
        ← Kembali ke Belanja
      </Link>
      <SubKegiatanDetail detail={detail} />
    </div>
  )
}
