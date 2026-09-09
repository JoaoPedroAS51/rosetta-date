import type { CanonicalToken } from './core/canonical'
import type { DecodedCanonical } from './core/decode'
import type { Dialect, Library } from './core/types'
import { decodeCanonical } from './core/decode'
import { sourceDialect } from './core/endpoint'
import { parse } from './core/parse'

/** A recognized token with its canonical semantics. */
export interface DescribedField extends DecodedCanonical {
  readonly kind: 'field'
  /** The token spelling as written in the source, e.g. `'DD'`. */
  readonly token: string
  /** The canonical symbol the token maps to, e.g. `'day-of-month/2-digit'`. */
  readonly canonical: CanonicalToken
}

/**
 * One described piece of a format string: a recognized field, decoded literal
 * text, or an unrecognized run.
 */
export type DescribedSegment
  = | { readonly kind: 'literal', readonly value: string }
    | DescribedField
    | { readonly kind: 'unknown', readonly value: string }

/**
 * Describe a format string without converting it.
 *
 * @param format - The format string to describe, e.g. `'DD/MM/YYYY'`.
 * @param endpoint - The dialect or library the format is written in.
 * @returns The described segments, in source order.
 *
 * @see {@link explain} to inspect a conversion to another endpoint.
 *
 * @example
 * ```ts
 * import { describe } from 'rosetta-date'
 * import { moment } from 'rosetta-date/dialects'
 *
 * describe('DD/MM', moment)
 * // [
 * //   { kind: 'field', token: 'DD', canonical: 'day-of-month/2-digit', field: 'day-of-month', style: '2-digit', qualifiers: [] },
 * //   { kind: 'literal', value: '/' },
 * //   { kind: 'field', token: 'MM', canonical: 'month/2-digit', field: 'month', style: '2-digit', qualifiers: [] },
 * // ]
 * ```
 */
export function describe(format: string, endpoint: Dialect | Library): DescribedSegment[] {
  return parse(format, sourceDialect(endpoint)).map((segment): DescribedSegment => {
    if (segment.kind === 'field')
      return { kind: 'field', token: segment.raw, canonical: segment.canonical, ...decodeCanonical(segment.canonical) }
    return segment
  })
}
