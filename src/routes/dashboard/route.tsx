import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { requireUser } from '@/shared/auth/middleware'

/**
 * Layout route for the dashboard section. Its `beforeLoad` guard makes
 * every nested route require a signed-in user, applies the dashboard
 * theme to the whole `/dashboard` subtree, and provides the tab nav
 * between the Ringkasan, Belanja, and Pendapatan views.
 */
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await requireUser()
    return { user }
  },
  component: DashboardLayout,
})

const tabClass = 'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors'
const tabActive = { className: 'border-obsidian text-obsidian' }
const tabInactive = {
  className: 'border-transparent text-steel hover:text-obsidian',
}

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-mist font-dm-sans text-ink">
      <header className="border-b border-fog bg-snow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-base font-semibold tracking-tight text-obsidian">
            BKAD Pasuruan Dashboard
          </span>
          <Link
            to="/auth/logout"
            className="rounded-full border border-graphite px-4 py-1.5 text-sm font-medium text-graphite transition-colors hover:bg-fog"
          >
            Keluar
          </Link>
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
