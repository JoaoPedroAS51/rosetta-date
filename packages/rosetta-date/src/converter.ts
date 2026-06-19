import type { Dialect, Library } from './core/types'
import type { UnsupportedTokenPolicy } from './core/unsupported'
import { parse } from './core/parse'
import { render } from './core/render'

/** The dialect an endpoint parses through — a library's precomputed effective grammar, or the dialect itself. */
function sourceDialect(endpoint: Dialect | Library): Dialect {
  return 'resolved' in endpoint ? endpoint.resolved.dialect : endpoint
}

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
 * Which endpoints to convert between, plus any {@link ConverterOptions}. Each
 * side is a {@link Dialect} (pure grammar) or a {@link Library} (a concrete tool,
 * e.g. `momentjs`, `dateFns`) — mix them freely. You import these or define your
 * own; passing them in keeps the conversion functions free of a central registry,
 * so unused tables are tree-shaken from your bundle.
 */
export interface ConvertOptions extends ConverterOptions {
  /** The dialect or library the input format string is written in. */
  readonly from: Dialect | Library
  /** The dialect or library to translate the format string into. */
  readonly to: Dialect | Library
}

/**
 * Convert a date-format token string from one endpoint to another.
 *
 * Each side may be a {@link Dialect} (pure grammar) or a {@link Library}; mix
 * them freely. Converting *to* a `Library` additionally routes any token that
 * library cannot render through `onUnsupportedToken`. This is the primitive:
 * direction travels with every call, which suits data-driven cases where
 * `from`/`to` are chosen at runtime. For a fixed direction reused many times,
 * {@link createConverter} reads better.
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
 * Build a reusable converter bound to a fixed `from` → `to` direction. Either
 * side may be a {@link Dialect} or a {@link Library} (see {@link convert}).
 *
 * The returned {@link Converter} is a clean `(format) => string` you can call
 * repeatedly or hand off as a callback. Per-target parsing/rendering work is
 * cached, so binding once is as cheap as it looks.
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
