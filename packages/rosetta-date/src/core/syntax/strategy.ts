import type { CanonicalToken } from '../canonical'
import type { TokenRule, TokenSyntax } from '../types'

/**
 * One unit of progress from {@link SyntaxStrategy.scan}: the piece found at the
 * scan position and `next`, the index just past it.
 *
 * @internal
 */
export type Scan
  = | { readonly kind: 'literal', readonly value: string, readonly next: number }
    | { readonly kind: 'token', readonly token: string, readonly canonical: CanonicalToken, readonly next: number }
    | { readonly kind: 'unknown', readonly value: string, readonly next: number }

/**
 * The tokenization behavior of one syntax family. Resolved from a
 * {@link TokenSyntax} config; the parser and renderer are generic over it, so a
 * new family is a new strategy, not an edit to either.
 *
 * @internal
 */
export interface SyntaxStrategy {
  /** Scan the next piece at `index`. Always advances (`next > index`). */
  readonly scan: (input: string, index: number, tokens: readonly TokenRule[]) => Scan
  /** Encode literal text so it round-trips without re-tokenizing in this family. */
  readonly escapeLiteral: (value: string) => string
  /**
   * What to place between two adjacent emitted tokens so they do not re-merge:
   * `''` when they are already safe, a boundary string when one is needed, or
   * `undefined` when this family cannot separate them.
   */
  readonly separator: (prev: string, cur: string, tokens: readonly TokenRule[]) => string | undefined
}
