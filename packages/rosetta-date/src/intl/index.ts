import type { CanonicalToken } from '../core/canonical'
import type { Dialect, Library, Segment } from '../core/types'
import type { UnsupportedTokenReason } from '../core/unsupported'
import { sourceDialect } from '../core/endpoint'
import { UnsupportedTokenError } from '../core/errors'
import { parse } from '../core/parse'
import { render, renderedTokens } from '../core/render'
import { canonicalToIntl, intlToCanonical } from './mapping'

/**
 * What to do with a field that has no clean conversion across the `Intl`
 * boundary.
 *
 * @remarks
 * `drop` omits the field. `throw` raises an {@link UnsupportedTokenError}.
 *
 * Narrower than the dialect-to-dialect `UnsupportedTokenPolicy`: `'literalize'`
 * and per-token handlers are pattern-string concepts. The `Intl` side is an
 * unordered options bag with no literals.
 *
 * @see {@link https://tc39.es/ecma402/#datetimeformat-objects | ECMA-402 `Intl.DateTimeFormat`}
 */
export type IntlUnsupportedPolicy = 'throw' | 'drop'

/** Options for {@link toIntlOptions}. */
export interface ToIntlOptions {
  /** The dialect or library the input format string is written in. */
  readonly from: Dialect | Library
  /** What to do with a field `Intl.DateTimeFormatOptions` cannot express. Defaults to `'drop'`. */
  readonly onUnsupportedToken?: IntlUnsupportedPolicy
}

/** Options for {@link fromIntlOptions}. */
export interface FromIntlOptions {
  /** The dialect or library to translate the options into. */
  readonly to: Dialect | Library
  /** What to do with an option the target cannot render. Defaults to `'drop'`. */
  readonly onUnsupportedToken?: IntlUnsupportedPolicy
}

/** Whether the target's grammar defines a token for `canonical`, ignoring library support. */
function definesCanonical(target: Dialect | Library, canonical: CanonicalToken): boolean {
  const dialect = 'resolved' in target ? target.resolved.dialect : target
  return dialect.tokens.some(rule => rule.canonical === canonical)
}

/**
 * Extract the locale-agnostic intent of a format string as an
 * {@link Intl.DateTimeFormatOptions} object, ready for `new Intl.DateTimeFormat`.
 *
 * The format's literals and field order are dropped by design: an Intl options
 * object is an unordered component bag. The locale decides layout at format
 * time, so `'DD/MM/YYYY'` and `'YYYY-MM-DD'` yield the same options.
 *
 * Fields with no clean `Intl.DateTimeFormatOptions` equivalent, such as quarter,
 * ordinals, day-of-year, ISO week fields, epoch, and stand-alone names, are
 * handled by `onUnsupportedToken`.
 *
 * @param format - The format string to read, e.g. `'YYYY-MM-DD HH:mm'`.
 * @param options - The source endpoint and unsupported-field policy.
 * @returns The equivalent Intl options.
 *
 * @see {@link https://tc39.es/ecma402/#datetimeformat-objects | ECMA-402 `Intl.DateTimeFormat`}
 *
 * @example
 * ```ts
 * import { toIntlOptions } from 'rosetta-date/intl'
 * import { moment } from 'rosetta-date/dialects'
 *
 * toIntlOptions('YYYY-MM-DD HH:mm', { from: moment })
 * // { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
 * ```
 */
export function toIntlOptions(format: string, options: ToIntlOptions): Intl.DateTimeFormatOptions {
  const { from, onUnsupportedToken = 'drop' } = options
  const reject = (token: string, reason: 'unrecognized' | 'unmappable'): void => {
    if (onUnsupportedToken === 'throw')
      throw new UnsupportedTokenError(token, reason)
  }

  const result: Intl.DateTimeFormatOptions = {}
  for (const segment of parse(format, sourceDialect(from))) {
    if (segment.kind === 'literal')
      continue
    if (segment.kind === 'unknown') {
      reject(segment.value, 'unrecognized')
      continue
    }

    const contribution = canonicalToIntl(segment.canonical)
    if (contribution === undefined) {
      reject(segment.raw, 'unmappable')
      continue
    }

    // A second field claiming an already-set Intl key with a different value
    // (e.g. `MMM` then `MM`) cannot be represented. Intl holds one per key.
    const collides = Object.entries(contribution).some(
      ([key, value]) => key in result && result[key as keyof Intl.DateTimeFormatOptions] !== value,
    )
    if (collides) {
      reject(segment.raw, 'unmappable')
      continue
    }

    Object.assign(result, contribution)
  }

  return result
}

/**
 * Translate an {@link Intl.DateTimeFormatOptions} object into a format string for
 * `to`.
 *
 * The style axis is the locale-correct path: `dateStyle`/`timeStyle` map to the
 * target's localized presets (`L`/`P`), which the library resolves per locale at
 * format time. No locale argument is needed. Component options map to explicit
 * tokens in CLDR canonical order. Since `Intl` options carry neither order nor
 * separators, that output is a skeleton, not a localized layout.
 *
 * Options the target cannot render, such as presets against a pure dialect or a
 * `dateStyle`/`timeStyle` mismatch with no fused preset, are handled by
 * `onUnsupportedToken`.
 *
 * @param intlOptions - The Intl options to translate.
 * @param options - The target endpoint and unsupported-field policy.
 * @returns The format string in the target's tokens.
 *
 * @see {@link https://tc39.es/ecma402/#datetimeformat-objects | ECMA-402 `Intl.DateTimeFormat`}
 *
 * @example
 * ```ts
 * import { fromIntlOptions } from 'rosetta-date/intl'
 * import { dayjs } from 'rosetta-date/libraries'
 *
 * fromIntlOptions({ dateStyle: 'short' }, { to: dayjs }) // 'L'
 * ```
 */
export function fromIntlOptions(intlOptions: Intl.DateTimeFormatOptions, options: FromIntlOptions): string {
  const { to, onUnsupportedToken = 'drop' } = options
  const reject = (token: string, reason: UnsupportedTokenReason): void => {
    if (onUnsupportedToken === 'throw')
      throw new UnsupportedTokenError(token, reason)
  }

  const { tokens, unsupported } = intlToCanonical(intlOptions)
  // Intl keys with no canonical at all (e.g. `dayPeriod`, an Intl-only zone style).
  for (const key of unsupported)
    reject(key, 'unmappable')

  const rendered = renderedTokens(to)
  const segments: Segment[] = []
  for (const canonical of tokens) {
    if (rendered.has(canonical))
      segments.push({ kind: 'field', canonical, raw: canonical })
    else
      // A token the grammar defines but the library gates is `unsupported-by-target`;
      // one the grammar has no spelling for at all is `unmappable`.
      reject(canonical, definesCanonical(to, canonical) ? 'unsupported-by-target' : 'unmappable')
  }

  // No `onUnsupportedToken` is threaded into `render`: `rendered` pre-filters to
  // tokens the target can spell, and an Intl options bag holds at most one value
  // per field group, so no two emitted tokens share a base character — the
  // unrepresentable-adjacency path is unreachable here.
  return render(segments, to)
}
