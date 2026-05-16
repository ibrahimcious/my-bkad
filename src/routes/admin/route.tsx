import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireUploader } from '@/shared/auth/middleware'

/**
 * Layout route for the admin section. Its `beforeLoad` guard restricts
 * every nested route to the uploader account. The upload UI is added
 * as a nested route in a later unit (U3).
 */
export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const user = await requireUploader()
    return { user }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return <Outlet />
}
