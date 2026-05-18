import type { UserRole } from '@prisma/client'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { getCurrentUserProfile, requireUser } from '@/shared/auth/middleware'

/**
 * Layout route for the dashboard section. Its `beforeLoad` guard makes
 * every nested route require a signed-in user; the loader fetches the
 * user's display profile for the nav bar. Provides the tab nav between
 * the Ringkasan, Belanja, and Pendapatan views, plus the page footer.
 */
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await requireUser()
    return { user }
  },
  loader: () => getCurrentUserProfile(),
  component: DashboardLayout,
})

/** Bahasa Indonesia label for each role, shown in the nav bar. */
const ROLE_LABEL: Record<UserRole, string> = {
  KEPALA: 'Kepala BKAD',
  SEKRETARIS: 'Sekretaris BKAD',
  UPLOADER: 'Data Uploader',
}

const tabClass = 'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors'
const tabActive = { className: 'border-obsidian text-obsidian' }
const tabInactive = {
  className: 'border-transparent text-steel hover:text-obsidian',
}

function DashboardLayout() {
  const profile = Route.useLoaderData()
  const year = new Date().getFullYear()

  return (
    <div className="flex min-h-screen flex-col bg-mist font-dm-sans text-ink">
      <header className="border-b border-fog bg-snow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="text-base font-semibold tracking-tight text-obsidian">
            BKAD Pasuruan Dashboard
          </span>
          <div className="flex items-center gap-4">
            {profile ? (
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-obsidian">
                  {profile.name}
                </p>
                <p className="text-xs text-steel">
                  {ROLE_LABEL[profile.role]}
                </p>
              </div>
            ) : null}
            <Link
              to="/auth/logout"
              className="rounded-full border border-graphite px-4 py-1.5 text-sm font-medium text-graphite transition-colors hover:bg-fog"
            >
              Keluar
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
          <Link
            to="/dashboard"
            activeOptions={{ exact: true }}
            className={tabClass}
            activeProps={tabActive}
            inactiveProps={tabInactive}
          >
            Ringkasan
          </Link>
          <Link
            to="/dashboard/belanja"
            className={tabClass}
            activeProps={tabActive}
            inactiveProps={tabInactive}
          >
            Belanja
          </Link>
          <Link
            to="/dashboard/pendapatan"
            className={tabClass}
            activeProps={tabActive}
            inactiveProps={tabInactive}
          >
            Pendapatan
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-fog bg-snow">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <p className="text-xs text-steel">
            Badan Keuangan dan Aset Daerah Kabupaten Pasuruan · © {year}
          </p>
        </div>
      </footer>
    </div>
  )
}
