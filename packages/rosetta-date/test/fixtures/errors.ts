import type { UnsupportedTokenReason } from 'rosetta-date'
import { UnsupportedTokenError } from 'rosetta-date'
import { expect } from 'vitest'

/**
 * Asymmetric matcher for the {@link UnsupportedTokenError} a conversion throws,
 * for use with `toThrow`.
 */
export function unsupportedError(token: string, reason: UnsupportedTokenReason): unknown {
  const fields = expect.objectContaining({ name: 'UnsupportedTokenError', token, reason })
  return {
    asymmetricMatch: (actual: unknown): boolean => actual instanceof UnsupportedTokenError && fields.asymmetricMatch(actual),
    toString: (): string => 'UnsupportedTokenError',
  }
}
