import type { Dialect, Library } from './core/types'
import type { DescribedField } from './describe'
import { definesCanonical } from './core/endpoint'
import { renderedTokens } from './core/render'
import { describe } from './describe'

/**
 * Why a field has no clean conversion. This is the subset of
 * `UnsupportedTokenReason` a per-token, static `explain` can produce:
 * `unmappable` when the target grammar has no token for the field, and
 * `unsupported-by-target` when the grammar has one but the target library does
 * not render it.
 */
export type ExplainedReason = 'unmappable' | 'unsupported-by-target'

/**
 * A described field plus the outcome of converting it to the target.
 *
 * @remarks
 * `converted` carries the `target` token the field becomes; `unsupported`
 * carries the {@link ExplainedReason}.
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
 * Explain what a conversion would do to a format, token by token, without
 * producing the converted string.
 *
 * @remarks
 * A read-only dry run of `convert`: it reports, per field, whether the target
 * can render it and as which token, or why it cannot. It builds on
 * {@link describe}: every field carries the same decoded semantics plus the
 * per-field conversion outcome. Literals are decoded per the source dialect's
 * literal rules, and unrecognized runs keep their source text.
 *
 * When `from` is a {@link Library}, parsing uses its effective grammar,
 * including library extensions. When `to` is a {@link Library}, its support
 * subset is applied to decide whether a field is `converted` or
 * `unsupported-by-target`.
 *
 * Each field is classified on its own. Whole-string rendering effects, such as
 * `unrepresentable-adjacency`, belong to the rendered output and are surfaced by
 * `convert`, not here.
 *
 * @param format - The format string to explain, e.g. `'Mo/YYYY'`.
 * @param options - The source and target endpoints.
 * @returns The explained segments, in source order.
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
