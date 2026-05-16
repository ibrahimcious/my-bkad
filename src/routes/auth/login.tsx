import { type FormEvent, useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getCurrentUser } from '@/shared/auth/middleware'
import { verifyPassword } from '@/shared/auth/password'
import { setSessionUser } from '@/shared/auth/session'
import { prisma } from '@/shared/db'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

/** Generic message — deliberately does not reveal whether the email exists. */
const INVALID_CREDENTIALS = 'Email atau kata sandi salah.'

type LoginResult = { ok: true } | { ok: false; error: string }

const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<LoginResult> => {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (!user) {
      return { ok: false, error: INVALID_CREDENTIALS }
    }
    const passwordValid = await verifyPassword(user.passwordHash, data.password)
    if (!passwordValid) {
      return { ok: false, error: INVALID_CREDENTIALS }
    }
    await setSessionUser({ userId: user.id, role: user.role })
    return { ok: true }
  })

export const Route = createFileRoute('/auth/login')({
  beforeLoad: async () => {
    // An already-authenticated user has no reason to see the login page.
    if (await getCurrentUser()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await loginFn({ data: { email, password } })
      if (result.ok) {
        await navigate({ to: '/dashboard' })
        return
      }
      setError(result.error)
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Masuk ke Dashboard BKAD
          </h1>
          <p className="text-sm text-muted-foreground">
            Masukkan email dan kata sandi Anda.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Kata Sandi</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Memproses…' : 'Masuk'}
        </Button>
      </form>
    </main>
  )
}
