import type { CanonicalToken } from './canonical'

/**
 * Structured parts of a {@link CanonicalToken}.
 */
export interface DecodedCanonical {
  /** The semantic field, e.g. `hour`, `day-of-month`, `localized-date-time`. */
  readonly field: string
  /** The representation style, e.g. `numeric`, `2-digit`, `wide`. */
  readonly style: string
  /** Trailing qualifiers that refine `field/style`, in order. Empty for the default form. */
  readonly qualifiers: readonly string[]
}

/**
 * Split a {@link CanonicalToken} into its semantic parts.
 *
 * @param token - The canonical symbol to decode.
 * @returns The {@link DecodedCanonical} parts.
 */
export function decodeCanonical(token: CanonicalToken): DecodedCanonical {
  const [field = '', style = '', ...qualifiers] = token.split('/')
  return { field, style, qualifiers }
}
