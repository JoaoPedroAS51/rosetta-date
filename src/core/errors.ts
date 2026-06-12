import type { UnsupportedTokenReason } from './unsupported'

function messageFor(token: string, reason: UnsupportedTokenReason, requires: string | undefined): string {
  switch (reason) {
    case 'unrecognized':
      return `Unrecognized token "${token}" in the source dialect`
    case 'unmappable':
      return `Token "${token}" has no equivalent in the target dialect`
    case 'unsupported-by-target':
      return `Token "${token}" is not rendered by the target library`
    case 'requires-plugin':
      return `Token "${token}" requires the target library's "${requires}" plugin`
    case 'requires-flag':
      return `Token "${token}" requires the target library's "${requires}" option`
    case 'requires-env':
      return `Token "${token}" requires "${requires}" in the target environment`
  }
}

/**
 * Thrown by a conversion when `onUnsupportedToken: 'throw'` is set and a token
 * cannot be converted cleanly. Inspect {@link token} and {@link reason} to react;
 * for a `requires-*` reason, {@link requires} names the unmet condition.
 */
export class UnsupportedTokenError extends Error {
  /** For a `requires-*` reason, the unmet condition's name; `undefined` otherwise. */
  readonly requires: string | undefined

  constructor(
    /** The offending token, e.g. `'K'` or `'MMMMM'`. */
    readonly token: string,
    /** Why the token could not be converted. */
    readonly reason: UnsupportedTokenReason,
    requires?: string,
  ) {
    super(messageFor(token, reason, requires))
    this.requires = requires
    this.name = 'UnsupportedTokenError'
  }
}
