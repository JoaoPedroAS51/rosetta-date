import type { Dialect } from './core/types'
import type { UnsupportedTokenPolicy } from './core/unsupported'
import { parse } from './core/parse'
import { render } from './core/render'

/**
 * A bound, single-direction converter: give it a format string, get the
 * translated one back. Produced by {@link createConverter}; handy to store once
 * and pass around (e.g. as a callback or injected dependency).
 */
export type Converter = (format: string) => string

/**
 * Behavioural options shared by {@link convert} and {@link createConverter}.
 */
export interface ConverterOptions {
  /**
   * What to do with a token that has no clean conversion — `'literalize'`
   * (default), `'throw'`, or a handler. See {@link UnsupportedTokenPolicy}.
   */
  readonly onUnsupportedToken?: UnsupportedTokenPolicy
}

/**
 * Which dialects to convert between, plus any {@link ConverterOptions}. The
 * dialects are {@link Dialect} objects you import (e.g. `moment`, `unicode`) or
 * define yourself — passing them in keeps the conversion functions free of a
 * central registry, so unused dialects are tree-shaken from your bundle.
 */
export interface ConvertOptions extends ConverterOptions {
  /** The dialect the input format string is written in. */
  readonly from: Dialect
  /** The dialect to translate the format string into. */
  readonly to: Dialect
}

/**
 * Convert a date-format token string from one dialect to another.
 *
 * This is the primitive: direction travels with every call, which suits
 * data-driven cases where `from`/`to` are chosen at runtime. For a fixed
 * direction reused many times, {@link createConverter} reads better.
 *
 * @param format - The format string to convert, e.g. `'DD/MM/YYYY'`.
 * @param options - The {@link ConvertOptions} carrying the source and target dialects.
 * @returns The format string rewritten in the target dialect.
 *
 * @example
 * ```ts
 * import { convert } from 'rosetta-date'
 * import { moment, unicode } from 'rosetta-date/dialects'
 *
 * convert('DD/MM/YYYY', { from: moment, to: unicode }) // 'dd/MM/yyyy'
 * convert('yyyy-MM-dd', { from: unicode, to: moment }) // 'YYYY-MM-DD'
 * ```
 */
export function convert(format: string, options: ConvertOptions): string {
  return render(parse(format, options.from), options.to, {
    from: options.from,
    onUnsupportedToken: options.onUnsupportedToken,
  })
}

/**
 * Build a reusable converter bound to a fixed `from` → `to` direction.
 *
 * The returned {@link Converter} is a clean `(format) => string` you can call
 * repeatedly or hand off as a callback. Per-dialect parsing/rendering work is
 * cached, so binding once is as cheap as it looks.
 *
 * @param from - The dialect inputs are written in.
 * @param to - The dialect to translate into.
 * @param options - Optional {@link ConverterOptions}, e.g. an unsupported-token policy.
 * @returns A {@link Converter} for the given direction.
 *
 * @example
 * ```ts
 * import { createConverter } from 'rosetta-date'
 * import { moment, unicode } from 'rosetta-date/dialects'
 *
 * const toDateFns = createConverter(moment, unicode)
 * toDateFns('YYYY-MM-DD') // 'yyyy-MM-dd'
 * toDateFns('hh:mm A')    // 'hh:mm a'
 * ```
 */
export function createConverter(from: Dialect, to: Dialect, options?: ConverterOptions): Converter {
  const renderOptions = { from, onUnsupportedToken: options?.onUnsupportedToken }
  return format => render(parse(format, from), to, renderOptions)
}
