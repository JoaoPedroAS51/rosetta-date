import type { CanonicalToken } from './core/canonical'
import type { DecodedCanonical } from './core/decode'
import type { Dialect, Library, LibraryDefinition } from './core/types'
import { decodeCanonical } from './core/decode'
import { sourceDialect } from './core/endpoint'
import { parse } from './core/parse'

/**
 * A recognized token, described: its spelling plus the canonical semantics it
 * carries.
 *
 * @remarks
 * Extends {@link DecodedCanonical}, so `field`, `style`, and `qualifiers` sit
 * alongside the raw `token` and its `canonical` symbol.
 */
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
 * Describe what a format string means, token by token, without converting it.
 *
 * @remarks
 * Parses `format` in `endpoint`'s grammar and surfaces the canonical semantics
 * that conversion normally keeps internal. Each recognized token is decoded into
 * its `field`/`style`/`qualifiers`; literals are decoded per the dialect's
 * literal rules, and unrecognized runs keep their source text.
 *
 * When `endpoint` is a {@link Library}, parsing uses its effective grammar,
 * including {@link LibraryDefinition.extends}. {@link LibraryDefinition.supports}
 * is not applied because `describe` does not render.
 *
 * This is the read-only counterpart to `convert` — useful for docs, tooltips,
 * validation, or any tool that needs to explain a pattern rather than translate
 * it. It stays pure: no rendering, no locale, no policy.
 *
 * @param format - The format string to describe, e.g. `'DD/MM/YYYY'`.
 * @param endpoint - The dialect or library the format is written in.
 * @returns The described segments, in source order.
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
