import type { Dialect, Library } from './core/types'
import type { UnsupportedTokenPolicy } from './core/unsupported'
import { sourceDialect } from './core/endpoint'
import { parse } from './core/parse'
import { render } from './core/render'

/** A reusable, single-direction converter created by {@link createConverter}. */
export type Converter = (format: string) => string

/** Options shared by {@link convert} and {@link createConverter}. */
export interface ConverterOptions {
  /**
   * What to do with a token that has no clean conversion: `'literalize'`
   * (default), `'throw'`, or a handler. See {@link UnsupportedTokenPolicy}.
   */
  readonly onUnsupportedToken?: UnsupportedTokenPolicy
}

/** Source, target, and unsupported-token options for {@link convert}. */
export interface ConvertOptions extends ConverterOptions {
  /** The dialect or library the input format string is written in. */
  readonly from: Dialect | Library
  /** The dialect or library to translate the format string into. */
  readonly to: Dialect | Library
}

/**
 * Convert a date-format token string from one endpoint to another.
 *
 * `from` and `to` may each be a {@link Dialect} or {@link Library}. When `to` is
 * a library, tokens outside its supported subset follow `onUnsupportedToken`.
 * Use {@link createConverter} to bind a fixed direction.
 *
 * @param format - The format string to convert, e.g. `'DD/MM/YYYY'`.
 * @param options - The {@link ConvertOptions} carrying the source and target ({@link Dialect} or {@link Library}).
 * @returns The format string rewritten in the target's tokens.
 *
 * @example
 * ```ts
 * import { convert } from 'rosetta-date'
 * import { ldml, moment } from 'rosetta-date/dialects'
 *
 * convert('DD/MM/YYYY', { from: moment, to: ldml }) // 'dd/MM/yyyy'
 * convert('yyyy-MM-dd', { from: ldml, to: moment }) // 'YYYY-MM-DD'
 * ```
 */
export function convert(format: string, options: ConvertOptions): string {
  const from = sourceDialect(options.from)
  return render(parse(format, from), options.to, {
    from,
    fromLibrary: 'resolved' in options.from ? options.from : undefined,
    onUnsupportedToken: options.onUnsupportedToken,
  })
}

/**
 * Build a reusable converter bound to a fixed source and target. Either side
 * may be a {@link Dialect} or a {@link Library} (see {@link convert}).
 *
 * Compiled token tables are cached by endpoint identity, so reuse the same
 * endpoint objects across calls.
 *
 * @param from - The dialect or library inputs are written in.
 * @param to - The dialect or library to translate into.
 * @param options - Optional {@link ConverterOptions}, e.g. an unsupported-token policy.
 * @returns A {@link Converter} for the given direction.
 *
 * @example
 * ```ts
 * import { createConverter } from 'rosetta-date'
 * import { ldml, moment } from 'rosetta-date/dialects'
 *
 * const toDateFns = createConverter(moment, ldml)
 * toDateFns('YYYY-MM-DD') // 'yyyy-MM-dd'
 * toDateFns('hh:mm A')    // 'hh:mm a'
 * ```
 */
export function createConverter(from: Dialect | Library, to: Dialect | Library, options?: ConverterOptions): Converter {
  const fromDialect = sourceDialect(from)
  const renderOptions = {
    from: fromDialect,
    fromLibrary: 'resolved' in from ? from : undefined,
    onUnsupportedToken: options?.onUnsupportedToken,
  }
  return format => render(parse(format, fromDialect), to, renderOptions)
}
