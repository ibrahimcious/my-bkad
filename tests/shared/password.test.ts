import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '@/shared/auth/password'

describe('password hashing', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(
      true,
    )
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('the-right-password')
    expect(await verifyPassword(hash, 'the-wrong-password')).toBe(false)
  })

  it('produces a distinct hash on each call (random salt)', async () => {
    const first = await hashPassword('same-password')
    const second = await hashPassword('same-password')
    expect(first).not.toBe(second)
  })

  it('returns false for a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('not-a-valid-argon2-hash', 'whatever')).toBe(
      false,
    )
  })
})
