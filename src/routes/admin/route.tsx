import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { requireUploader } from '@/shared/auth/middleware'

/**
 * Layout route for the admin section. Its `beforeLoad` guard restricts
 * every nested route to the uploader account, and it provides the
 * shared admin header and navigation.
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const user = await requireUploader()
    return { user }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-4">
          <span className="font-semibold tracking-tight">
            BKAD Pasuruan — Administrasi
          </span>
          <Link
            to="/admin/upload"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Unggah Belanja
          </Link>
          <Link
            to="/admin/upload-pendapatan"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Unggah Pendapatan
          </Link>
          <Link
            to="/admin/sub-bidang"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Pemetaan Sub Bidang
          </Link>
        </nav>
        <Link
          to="/auth/logout"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Keluar
        </Link>
      </header>
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
