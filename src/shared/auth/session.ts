import { UserRole } from '@prisma/client'
import {
  clearSession,
  getSession,
  updateSession,
} from '@tanstack/react-start/server'
import { z } from 'zod'

/** Shape of the data sealed inside the session cookie. */
const sessionUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(UserRole),
})

export type SessionUser = z.infer<typeof sessionUserSchema>

/** Session cookie lifetime: one working day. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

/**
 * Build the session config. The signing/encryption password is read
 * lazily (not at module load) so importing this file during tests or
 * the production build does not require the secret to be present.
 */
function sessionConfig() {
  const password = process.env.SESSION_PASSWORD
  if (!password || password.length < 32) {
    throw new Error(
      'SESSION_PASSWORD must be set to a string of at least 32 characters',
    )
  }
  return {
    password,
    name: 'bkad_session',
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  } as const
}

/**
 * Read and validate the current session. Returns null when no cookie
 * is present or its contents do not match the expected shape.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession<SessionUser>(sessionConfig())
  const parsed = sessionUserSchema.safeParse(session.data)
  return parsed.success ? parsed.data : null
}

/** Seal the given user identity into the session cookie (login). */
export async function setSessionUser(user: SessionUser): Promise<void> {
  await updateSession(sessionConfig(), user)
}

/** Clear the session cookie (logout). */
export async function clearSessionUser(): Promise<void> {
  await clearSession(sessionConfig())
}
