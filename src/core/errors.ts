import type { UnsupportedTokenReason } from './unsupported'

/**
 * Thrown by a conversion when `onUnsupportedToken: 'throw'` is set and a token
 * cannot be converted cleanly. Inspect {@link token} and {@link reason} to react.
 */
export class UnsupportedTokenError extends Error {
  constructor(
    /** The offending token, e.g. `'K'` or `'QQQ'`. */
    readonly token: string,
    /** Why the token could not be converted. */
    readonly reason: UnsupportedTokenReason,
  ) {
    super(
      reason === 'unrecognized'
        ? `Unrecognized token "${token}" in the source dialect`
        : `Token "${token}" has no equivalent in the target dialect`,
    )
    this.name = 'UnsupportedTokenError'
  }
}
