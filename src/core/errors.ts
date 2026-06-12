import type { UnsupportedTokenReason } from './unsupported'

function messageFor(token: string, reason: UnsupportedTokenReason): string {
  switch (reason) {
    case 'unrecognized':
      return `Unrecognized token "${token}" in the source dialect`
    case 'unmappable':
      return `Token "${token}" has no equivalent in the target dialect`
    case 'unsupported-by-target':
      return `Token "${token}" is not rendered by the target library`
  }
}

/**
 * Thrown by a conversion when `onUnsupportedToken: 'throw'` is set and a token
 * cannot be converted cleanly. Inspect {@link token} and {@link reason} to react.
 */
export class UnsupportedTokenError extends Error {
  constructor(
    /** The offending token, e.g. `'K'` or `'MMMMM'`. */
    readonly token: string,
    /** Why the token could not be converted. */
    readonly reason: UnsupportedTokenReason,
  ) {
    super(messageFor(token, reason))
    this.name = 'UnsupportedTokenError'
  }
}
