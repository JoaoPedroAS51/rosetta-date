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
 *
 * Treat a dialect as an immutable singleton: define it once and reuse that object.
 * The engine caches its compiled token tables keyed by object identity, so a
 * freshly built dialect on every call recompiles instead of hitting the cache.
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
 * The declarative shape passed to {@link defineLibrary}: the {@link Dialect} a
 * tool speaks, its own extension tokens, and the subset it renders. Where a
 * `Dialect` answers "does this token exist, and what does it mean?", a library
 * answers "does this tool render it?" — e.g. `dayjs` speaks the `moment` grammar
 * but does not render `Mo` (it mangles it to `6o`).
 *
 * A library's **effective grammar** is its dialect plus any {@link extends}
 * tokens it adds: the dialect stays the pure spec while the tool's own extension
 * tokens live in `extends`.
 */
export interface LibraryDefinition {
  /** Stable identifier, e.g. `'momentjs'`, `'dayjs'`, `'date-fns'`. */
  readonly name: string
  /** The base grammar (a spec, or a reference implementation) this library speaks. */
  readonly dialect: Dialect
  /**
   * Tokens this library adds on top of {@link dialect} — the tool's own extensions
   * to the spec (e.g. date-fns's `t`/`T`, `R`/`I`/`i`, `P…`). Each must map to a
   * canonical symbol and must not collide with a dialect token.
   */
  readonly extends?: readonly TokenRule[]
  /**
   * The tokens this library can render — its subset of the effective grammar
   * (dialect + {@link extends}). Omit to mean "the whole effective grammar" (a
   * reference implementation). Every token listed must exist in the dialect or in
   * `extends`.
   */
  readonly supports?: ReadonlySet<string>
}

/**
 * The render target a {@link Library} carries, computed once by
 * {@link defineLibrary}. The engine reads this directly, so converting through a
 * library needs no resolution step at render time — and a dialect-only conversion
 * never reaches the merge logic, keeping it out of that bundle.
 */
export interface ResolvedLibrary {
  /** Effective grammar: the base dialect with any {@link LibraryDefinition.extends} merged in. */
  readonly dialect: Dialect
  /** Whether the library renders a given token (its supported subset). */
  readonly renders: (token: string) => boolean
}

/**
 * A concrete date library, produced by {@link defineLibrary}: its
 * {@link LibraryDefinition} plus the precomputed {@link resolved} render target.
 * Pass a `Library` on either side of a conversion to read it as "lib X → lib Y";
 * plain {@link Dialect} conversion stays fully supported and unchanged.
 */
export interface Library extends LibraryDefinition {
  /** Precomputed effective grammar and render predicate — read by the engine. */
  readonly resolved: ResolvedLibrary
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
