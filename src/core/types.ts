import type { CanonicalToken } from './canonical'

/**
 * How a dialect delimits and escapes literal (verbatim) text.
 *
 * Two families exist in practice:
 * - **Bracketed** (moment): text between `open` and `close` is literal, e.g.
 *   `[literal]`. There is no in-band escape for the closing bracket.
 * - **Quoted** (ldml / LDML): text between two `open`/`close` quotes is
 *   literal, and a doubled quote (`escapedDelimiter`) stands for one literal
 *   quote character, e.g. `'o''clock'` → `o'clock`.
 */
export interface LiteralRules {
  /** Opening delimiter, e.g. `[` (moment) or `'` (ldml). */
  readonly open: string
  /** Closing delimiter, e.g. `]` (moment) or `'` (ldml). */
  readonly close: string
  /**
   * Sequence that represents a single literal delimiter character inside (or
   * outside) a quoted run, e.g. `''` in LDML. Omit for bracketed dialects,
   * which have no such escape.
   */
  readonly escapedDelimiter?: string
}

/**
 * One row of a dialect's token table: a dialect token paired with the canonical
 * symbol it means.
 *
 * A canonical symbol may appear on more than one row (aliases). The first row
 * for a given symbol is treated as the primary spelling used when rendering to
 * this dialect; every row is honoured when parsing from it.
 */
export interface TokenRule {
  /** The dialect's literal token, e.g. `YYYY` (moment) or `yyyy` (ldml). */
  readonly token: string
  /** The canonical symbol this token maps to. */
  readonly canonical: CanonicalToken
}

/**
 * A dialect: a token grammar expressed as data. The conversion engine is generic
 * and reads everything it needs from here, so adding a dialect means adding one
 * of these — never touching the parser or renderer.
 */
export interface Dialect {
  /** Stable identifier, e.g. `'moment'` or `'ldml'`. */
  readonly name: string
  /** How this dialect delimits and escapes literal text. */
  readonly literal: LiteralRules
  /** The token ↔ canonical mappings that define this dialect. */
  readonly tokens: readonly TokenRule[]
}

/**
 * A concrete date library: the {@link Dialect} (grammar) it speaks paired with
 * the subset of that grammar it actually renders. Where a `Dialect` answers
 * "does this token exist, and what does it mean?", a `Library` answers "does this
 * tool render it?" — e.g. `dayjs` speaks the `moment` grammar but does not render
 * `Mo` (it mangles it to `6o`).
 *
 * Converting *to* a library renders through its dialect and routes any token the
 * library cannot spell through the unsupported-token policy, so a conversion can
 * warn or throw instead of emitting something the tool will mishandle. Pass a
 * `Library` on either side to read a conversion as "lib X → lib Y"; plain
 * {@link Dialect} conversion stays fully supported and unchanged.
 */
export interface Library {
  /** Stable identifier, e.g. `'momentjs'`, `'dayjs'`, `'date-fns'`. */
  readonly name: string
  /** The grammar this library speaks. */
  readonly dialect: Dialect
  /**
   * The tokens this library renders. Omit to mean "the whole dialect" — the
   * reference implementation. Every token listed must exist in {@link dialect}.
   */
  readonly supports?: ReadonlySet<string>
  /**
   * Optional human-readable quirks keyed by token, e.g. `'z'` →
   * `'empty without moment-timezone'`. Not consulted by the engine.
   */
  readonly notes?: ReadonlyMap<string, string>
}

/**
 * A single piece of a parsed format string — the engine's intermediate
 * representation. A format is parsed into a list of these, then rendered back
 * out in another dialect.
 */
export type Segment
  /** Verbatim text that must survive conversion unchanged. */
  = | { readonly kind: 'literal', readonly value: string }
  /** A recognized field, normalized to its canonical symbol. */
    | { readonly kind: 'field', readonly canonical: CanonicalToken, readonly raw: string }
  /**
   * A run of pattern characters the source dialect did not recognize. The
   * configured unsupported-token policy decides its fate; by default it is
   * rendered as an escaped literal.
   */
    | { readonly kind: 'unknown', readonly value: string }
