import type { Dialect, Library, Segment } from '../core/types'
import type { UnsupportedTokenReason } from '../core/unsupported'
import { definesCanonical, sourceDialect } from '../core/endpoint'
import { UnsupportedTokenError } from '../core/errors'
import { parse } from '../core/parse'
import { render, renderedTokens } from '../core/render'
import { canonicalToIntl, intlToCanonical } from './mapping'

/**
 * How to handle a field that `Intl` cannot represent.
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

/**
 * Extract the locale-agnostic intent of a format string as an
 * {@link Intl.DateTimeFormatOptions} object, ready for `new Intl.DateTimeFormat`.
 *
 * Intl options do not encode literals or field order. The locale decides layout
 * at format time, so `'DD/MM/YYYY'` and `'YYYY-MM-DD'` yield the same options.
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
 * `dateStyle` and `timeStyle` map to the target's localized presets (`L`/`P`),
 * which the library resolves per locale at format time. Component options map
 * to explicit tokens in CLDR canonical order. Because `Intl` options carry
 * neither order nor separators, component output is a skeleton rather than a
 * localized layout.
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
  // Intl keys with no canonical mapping, such as `dayPeriod` or Intl-only zone styles.
  for (const key of unsupported)
    reject(key, 'unmappable')

  const rendered = renderedTokens(to)
  const segments: Segment[] = []
  for (const canonical of tokens) {
    if (rendered.has(canonical))
      segments.push({ kind: 'field', canonical, raw: canonical })
    else
      // Distinguish library exclusions from fields absent from the target grammar.
      reject(canonical, definesCanonical(to, canonical) ? 'unsupported-by-target' : 'unmappable')
  }

  // `rendered` excludes unsupported tokens. Intl options also hold at most one
  // value per field group, so rendered tokens cannot hit the adjacency policy.
  return render(segments, to)
}
