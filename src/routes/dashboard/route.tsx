import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { requireUser } from '@/shared/auth/middleware'

/**
 * Layout route for the dashboard section. Its `beforeLoad` guard makes
 * every nested route require a signed-in user. Dashboard content is
 * added as nested routes in a later unit (U4).
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold tracking-tight">
          BKAD Pasuruan Dashboard
        </span>
        <Link
          to="/auth/logout"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Keluar
        </Link>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
