import { hash, verify } from '@node-rs/argon2'

/**
 * Cost parameters for password hashing. Memory cost is in KiB; the
 * values match the OWASP-recommended minimum (19 MiB memory, 2
 * iterations, 1 lane) and are pinned explicitly rather than relying on
 * library defaults.
 *
 * The algorithm is left at @node-rs/argon2's default, which is
 * argon2id. Its `Algorithm` enum is not imported to set it explicitly
 * because that export is a `const enum`, which cannot be used as a
 * value while the project has `verbatimModuleSyntax` enabled.
 */
const HASH_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const

/** Hash a plaintext password into an encoded argon2id PHC string. */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain, HASH_OPTIONS)
}

/**
 * Verify a plaintext password against a stored argon2id hash. Returns
 * false — never throws — for a non-matching password or a malformed
 * stored hash (e.g. the U1 seed placeholder before the U2 seed has
 * been re-run), so callers can treat it as a plain boolean check.
 */
export async function verifyPassword(
  storedHash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, plain)
  } catch {
    return false
  }
}
