import type { Dialect, Library } from './core/types'
import type { DescribedField } from './describe'
import { definesCanonical } from './core/endpoint'
import { renderedTokens } from './core/render'
import { describe } from './describe'

/**
 * Why a field has no clean conversion. This subset of `UnsupportedTokenReason`
 * covers the outcomes that `explain` can determine for one token:
 * `unmappable` when the target grammar has no token for the field, and
 * `unsupported-by-target` when the grammar has one but the target library does
 * not render it.
 */
export type ExplainedReason = 'unmappable' | 'unsupported-by-target'

/**
 * A described field and its target-conversion outcome.
 */
export type ExplainedField
  = DescribedField & (
    | { readonly status: 'converted', readonly target: string }
    | { readonly status: 'unsupported', readonly reason: ExplainedReason }
  )

/**
 * One explained piece of a format string: a field with its conversion outcome,
 * decoded literal text, or an unrecognized run.
 */
export type ExplainedSegment
  = | { readonly kind: 'literal', readonly value: string }
    | ExplainedField
    | { readonly kind: 'unknown', readonly value: string }

/** Which endpoints to explain a conversion between. */
export interface ExplainOptions {
  /** The dialect or library the format is written in. */
  readonly from: Dialect | Library
  /** The dialect or library it would be converted to. */
  readonly to: Dialect | Library
}

/**
 * Explain a conversion without producing the converted format string.
 *
 * @param format - The format string to explain, e.g. `'Mo/YYYY'`.
 * @param options - The source and target endpoints.
 * @returns The explained segments, in source order.
 *
 * @see {@link describe} to inspect a format without a target endpoint.
 *
 * @example
 * ```ts
 * import { explain } from 'rosetta-date'
 * import { dayjs, momentjs } from 'rosetta-date/libraries'
 *
 * explain('DDD', { from: momentjs, to: dayjs })
 * // [{ kind: 'field', token: 'DDD', canonical: 'day-of-year/numeric', field: 'day-of-year',
 * //    style: 'numeric', qualifiers: [], status: 'unsupported', reason: 'unsupported-by-target' }]
 * ```
 */
export function explain(format: string, options: ExplainOptions): ExplainedSegment[] {
  const { from, to } = options
  const rendered = renderedTokens(to)

  return describe(format, from).map((segment): ExplainedSegment => {
    if (segment.kind !== 'field')
      return segment

    const target = rendered.get(segment.canonical)
    if (target !== undefined)
      return { ...segment, status: 'converted', target }

    const reason = definesCanonical(to, segment.canonical) ? 'unsupported-by-target' : 'unmappable'
    return { ...segment, status: 'unsupported', reason }
  })
}
