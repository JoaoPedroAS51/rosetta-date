import type { CanonicalToken } from './canonical'

/**
 * A grammar with letter tokens and delimited literal text.
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
 * or `%m`.
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
 * One token-to-canonical mapping in a dialect.
 */
export interface TokenRule {
  /** The dialect's token spelling, e.g. `YYYY` or `yyyy`. */
  readonly token: string
  /** The canonical symbol this token maps to. */
  readonly canonical: CanonicalToken
}

/**
 * A token that expands to a sub-pattern while parsing.
 */
export interface CompositeRule {
  /** The composite spelling. */
  readonly token: string
  /** The sub-pattern it expands to, written in this dialect's grammar. */
  readonly expandsTo: string
}

/**
 * Immutable token grammar data.
 */
export interface Dialect {
  /** Stable identifier for this dialect. */
  readonly name: string
  /** How this dialect separates tokens from literal text. */
  readonly syntax: TokenSyntax
  /** The token-to-canonical mappings that define this dialect. */
  readonly tokens: readonly TokenRule[]
  /** Composite spellings that expand to sub-patterns during parsing. Omit when none. */
  readonly composites?: readonly CompositeRule[]
}

/**
 * Declarative input for {@link defineLibrary}.
 */
export interface LibraryDefinition {
  /** Stable identifier for this library. */
  readonly name: string
  /** The spec or reference grammar used by the library. */
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
   * Rendered fields use the dialect's primary spelling: the first
   * {@link TokenRule} for that canonical in token-table order. Output spelling is
   * a dialect concern.
   */
  readonly supports?: ReadonlySet<CanonicalToken>
}

/**
 * Resolved rendering data for a {@link Library}.
 */
export interface ResolvedLibrary {
  /** Effective grammar: the base dialect with any {@link LibraryDefinition.extends} merged in. */
  readonly dialect: Dialect
  /** Whether the library renders a given canonical field (its supported subset). */
  readonly renders: (canonical: CanonicalToken) => boolean
}

/**
 * Concrete date library metadata returned by {@link defineLibrary}.
 */
export interface Library extends LibraryDefinition {
  /** Precomputed effective grammar and render predicate read by the engine. */
  readonly resolved: ResolvedLibrary
}

/**
 * A parsed format-string segment.
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
