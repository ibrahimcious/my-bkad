import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { clearSessionUser } from '@/shared/auth/session'

const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  await clearSessionUser()
})

export const Route = createFileRoute('/auth/logout')({
  // Clearing the session is the route's only job; it always redirects
  // to the login page, so no component is ever rendered.
  beforeLoad: async () => {
    await logoutFn()
    throw redirect({ to: '/auth/login' })
  },
})
