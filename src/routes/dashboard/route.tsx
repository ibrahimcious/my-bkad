import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { requireUser } from '@/shared/auth/middleware'

/**
 * Layout route for the dashboard section. Its `beforeLoad` guard makes
 * every nested route require a signed-in user, and it applies the
 * dashboard theme (see DESIGN.md) to the whole `/dashboard` subtree.
 */
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await requireUser()
    return { user }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-mist font-dm-sans text-ink">
      <header className="border-b border-fog bg-snow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
