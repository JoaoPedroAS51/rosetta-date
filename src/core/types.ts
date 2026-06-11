import type { CanonicalToken } from './canonical'

/**
 * How a dialect delimits and escapes literal (verbatim) text.
 *
 * Two families exist in practice:
 * - **Bracketed** (moment): text between `open` and `close` is literal, e.g.
 *   `[literal]`. There is no in-band escape for the closing bracket.
 * - **Quoted** (unicode / LDML): text between two `open`/`close` quotes is
 *   literal, and a doubled quote (`escapedDelimiter`) stands for one literal
 *   quote character, e.g. `'o''clock'` → `o'clock`.
 */
export interface LiteralRules {
  /** Opening delimiter, e.g. `[` (moment) or `'` (unicode). */
  readonly open: string
  /** Closing delimiter, e.g. `]` (moment) or `'` (unicode). */
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
  /** The dialect's literal token, e.g. `YYYY` (moment) or `yyyy` (unicode). */
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
  /** Stable identifier, e.g. `'moment'` or `'unicode'`. */
  readonly name: string
  /** How this dialect delimits and escapes literal text. */
  readonly literal: LiteralRules
  /** The token ↔ canonical mappings that define this dialect. */
  readonly tokens: readonly TokenRule[]
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
   * A run of pattern characters the source dialect did not recognize. Kept as a
   * distinct kind so a later unknown-token policy can decide its fate; the
   * permissive engine renders it as an escaped literal.
   */
    | { readonly kind: 'unknown', readonly value: string }
