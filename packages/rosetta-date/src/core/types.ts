import type { CanonicalToken } from './canonical'

/**
 * A grammar where ASCII letters are token characters and literal text is set off
 * by delimiters.
 *
 * @remarks
 * Two delimiter models:
 * - **Bracketed**: text between distinct `open` and `close` delimiters is
 *   literal. There is no in-band escape for the closing delimiter.
 * - **Quoted**: text between matching `open`/`close` delimiters is literal, and
 *   `escapedDelimiter` represents one literal delimiter character.
 */
export interface DelimitedSyntax {
  readonly kind: 'delimited'
  /** Opening delimiter, e.g. `[` or `'`. */
  readonly open: string
  /** Closing delimiter, e.g. `]` or `'`. */
  readonly close: string
  /**
   * Sequence that represents a single literal delimiter character inside (or
   * outside) a quoted run. Omit for delimiter models that have no such escape.
   */
  readonly escapedDelimiter?: string
}

/**
 * A grammar where every token is introduced by a `marker` prefix, such as `%Y`
 * or `%m`. Everything else, including letters, is literal. The marker is escaped
 * by doubling it, so `%%` represents a literal `%`.
 *
 * @remarks
 * Token spellings include the marker (`'%Y'`, not `'Y'`). Because each token is
 * self-delimiting, adjacent tokens never re-merge, so this family needs no
 * boundary between them.
 */
export interface DirectiveSyntax {
  readonly kind: 'directive'
  /** The prefix that introduces a token, e.g. `%`. Doubling it is a literal marker. */
  readonly marker: string
}

/**
 * How a dialect separates tokens from literal text. Each union member represents
 * one tokenization family.
 */
export type TokenSyntax = DelimitedSyntax | DirectiveSyntax

/**
 * One row of a dialect's token table.
 *
 * @remarks
 * A token rule pairs a concrete token spelling with the canonical symbol it
 * represents.
 *
 * A canonical symbol may appear on more than one row (aliases). Every row is
 * honored when parsing from this dialect.
 */
export interface TokenRule {
  /** The dialect's token spelling, e.g. `YYYY` or `yyyy`. */
  readonly token: string
  /** The canonical symbol this token maps to. */
  readonly canonical: CanonicalToken
}

/**
 * Defines a token grammar as immutable data.
 *
 * @remarks
 * Scope: a tokenization syntax plus token-to-canonical mappings.
 *
 * Usage: define a dialect once and reuse that object. Compiled token tables are
 * cached by object identity, so rebuilding a dialect for every conversion misses
 * the cache.
 */
export interface Dialect {
  /** Stable identifier for this dialect. */
  readonly name: string
  /** How this dialect separates tokens from literal text. */
  readonly syntax: TokenSyntax
  /** The token-to-canonical mappings that define this dialect. */
  readonly tokens: readonly TokenRule[]
}

/**
 * Declarative input passed to {@link defineLibrary}.
 *
 * @remarks
 * Base grammar: {@link LibraryDefinition.dialect} defines the grammar the
 * library starts from.
 *
 * Extensions: {@link LibraryDefinition.extends} adds library-specific token
 * spellings on top of the base grammar.
 *
 * Support model: {@link LibraryDefinition.supports} narrows the effective
 * grammar to the canonical fields the library can render. Omit it when every
 * field in the effective grammar is renderable.
 */
export interface LibraryDefinition {
  /** Stable identifier for this library. */
  readonly name: string
  /** The base grammar (a spec, or a reference implementation) this library speaks. */
  readonly dialect: Dialect
  /**
   * Tokens this library adds on top of {@link LibraryDefinition.dialect}.
   *
   * Each token must map to a canonical symbol and must not collide with a base
   * dialect token.
   */
  readonly extends?: readonly TokenRule[]
  /**
   * The canonical fields this library renders: its subset of the effective
   * grammar's canonicals ({@link LibraryDefinition.dialect} +
   * {@link LibraryDefinition.extends}).
   *
   * Omit to mean "renders every field". Every canonical listed must be expressible
   * by {@link LibraryDefinition.dialect} or {@link LibraryDefinition.extends}.
   * Keyed by canonical field, not token spelling: it gates which fields render,
   * never how they are spelled.
   *
   * Rendered fields use the dialect's primary spelling, which is the first
   * {@link TokenRule} for that canonical in token-table order. To render a
   * different alias, use a dialect whose token table makes that alias primary.
   */
  readonly supports?: ReadonlySet<CanonicalToken>
}

/**
 * Precomputed render metadata carried by a {@link Library}.
 *
 * @remarks
 * This is produced by {@link defineLibrary}. Consumers normally read it only
 * indirectly by passing a {@link Library} to conversion APIs.
 */
export interface ResolvedLibrary {
  /** Effective grammar: the base dialect with any {@link LibraryDefinition.extends} merged in. */
  readonly dialect: Dialect
  /** Whether the library renders a given canonical field (its supported subset). */
  readonly renders: (canonical: CanonicalToken) => boolean
}

/**
 * Concrete date library metadata produced by {@link defineLibrary}.
 *
 * @remarks
 * A library is a {@link LibraryDefinition} plus its precomputed
 * {@link Library.resolved} render target. Pass it to conversion APIs when the
 * target should honor library-specific extensions or support subsets.
 */
export interface Library extends LibraryDefinition {
  /** Precomputed effective grammar and render predicate read by the engine. */
  readonly resolved: ResolvedLibrary
}

/**
 * A single piece of a parsed format string.
 *
 * @remarks
 * This is the internal intermediate representation used between parsing and
 * rendering.
 */
export type Segment
  /** Decoded literal text that must survive conversion as literal text. */
  = | { readonly kind: 'literal', readonly value: string }
  /** A recognized field, normalized to its canonical symbol. */
    | { readonly kind: 'field', readonly canonical: CanonicalToken, readonly raw: string }
  /**
   * A run of pattern characters the source dialect did not recognize. The
   * configured unsupported-token policy decides its fate; by default it is
   * rendered as an escaped literal.
   */
    | { readonly kind: 'unknown', readonly value: string }
