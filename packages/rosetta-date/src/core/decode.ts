import type { CanonicalToken } from './canonical'

/**
 * A {@link CanonicalToken} split into its grammar parts.
 *
 * @remarks
 * The canonical grammar is `field/style[/qualifier...]`. This is the structured
 * view of that string: `field` and `style` are always present, `qualifiers`
 * holds any trailing refinements, such as `iso`, hour-cycle qualifiers
 * (`h11`/`h12`/`h23`/`h24`), or `standalone`.
 *
 * @internal
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
 * Decode a {@link CanonicalToken} into its `field`, `style`, and `qualifiers`.
 *
 * @remarks
 * A pure split on `/`: the field keeps any internal hyphens (`day-of-month`,
 * `fractional-second`), since the grammar only separates parts with `/`. This is
 * the structural primitive behind the `Intl` adapter.
 *
 * @param token - The canonical symbol to decode.
 * @returns The {@link DecodedCanonical} parts.
 *
 * @internal
 */
export function decodeCanonical(token: CanonicalToken): DecodedCanonical {
  const [field = '', style = '', ...qualifiers] = token.split('/')
  return { field, style, qualifiers }
}
