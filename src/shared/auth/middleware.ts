import { UserRole } from '@prisma/client'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { prisma } from '@/shared/db'

import { type SessionUser, getSessionUser } from './session'

/**
 * Return the signed-in user, or null when no valid session exists.
 * Use this when the caller needs to branch on auth state rather than
 * enforce it — e.g. the login page redirecting an already-signed-in
 * user away.
 */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  (): Promise<SessionUser | null> => getSessionUser(),
)

/** The signed-in user's display identity, for the dashboard nav bar. */
export interface UserProfile {
  name: string
  role: UserRole
}

/**
 * The signed-in user's name and role for display. The session cookie
 * holds only the id and role, so the name is read from the database.
 * Returns null when no valid session exists.
 */
export const getCurrentUserProfile = createServerFn({ method: 'GET' }).handler(
  async (): Promise<UserProfile | null> => {
    const session = await getSessionUser()
    if (!session) return null
    return prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true },
    })
  },
)

/**
 * Route guard for any signed-in user. Redirects to the login page when
 * no valid session exists. Call from a route `beforeLoad`.
 */
export const requireUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser> => {
    const user = await getSessionUser()
    if (!user) {
      throw redirect({ to: '/auth/login' })
    }
    return user
  },
)

/**
 * Route guard for the uploader account only. Redirects anonymous users
 * to the login page and signed-in non-uploaders to the dashboard. This
 * is the server-side enforcement point for admin-only access.
 */
export const requireUploader = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser> => {
    const user = await getSessionUser()
    if (!user) {
      throw redirect({ to: '/auth/login' })
    }
    if (user.role !== UserRole.UPLOADER) {
      throw redirect({ to: '/dashboard' })
    }
    return user
  },
)
