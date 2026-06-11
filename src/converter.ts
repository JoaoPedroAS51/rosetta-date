import type { DialectName } from './dialects/registry'
import { parse } from './core/parse'
import { render } from './core/render'
import { getDialect } from './dialects/registry'

/**
 * A bound, single-direction converter: give it a format string, get the
 * translated one back. Produced by {@link createConverter}; handy to store once
 * and pass around (e.g. as a callback or injected dependency).
 */
export type Converter = (format: string) => string

/**
 * Which dialects to convert between. Both names are {@link DialectName}s, so
 * editors autocomplete the supported dialects.
 */
export interface ConvertOptions {
  /** The dialect the input format string is written in. */
  readonly from: DialectName
  /** The dialect to translate the format string into. */
  readonly to: DialectName
}

/**
 * Convert a date-format token string from one dialect to another.
 *
 * This is the primitive: direction travels with every call, which suits
 * data-driven cases where `from`/`to` are not known ahead of time. For a fixed
 * direction reused many times, {@link createConverter} reads better.
 *
 * @param format - The format string to convert, e.g. `'DD/MM/YYYY'`.
 * @param options - The {@link ConvertOptions} naming the source and target dialects.
 * @returns The format string rewritten in the target dialect.
 *
 * @example
 * ```ts
 * convert('DD/MM/YYYY', { from: 'moment', to: 'unicode' }) // 'dd/MM/yyyy'
 * convert('yyyy-MM-dd', { from: 'unicode', to: 'moment' }) // 'YYYY-MM-DD'
 * ```
 */
export function convert(format: string, options: ConvertOptions): string {
  return render(parse(format, getDialect(options.from)), getDialect(options.to))
}

/**
 * Build a reusable converter bound to a fixed `from` → `to` direction.
 *
 * The dialects are resolved once, so the returned {@link Converter} is a clean
 * `(format) => string` you can call repeatedly or hand off as a callback.
 *
 * @param from - The dialect inputs are written in.
 * @param to - The dialect to translate into.
 * @returns A {@link Converter} for the given direction.
 *
 * @example
 * ```ts
 * const toDateFns = createConverter('moment', 'unicode')
 * toDateFns('YYYY-MM-DD') // 'yyyy-MM-dd'
 * toDateFns('hh:mm A')    // 'hh:mm a'
 * ```
 */
export function createConverter(from: DialectName, to: DialectName): Converter {
  const source = getDialect(from)
  const target = getDialect(to)
  return format => render(parse(format, source), target)
}
