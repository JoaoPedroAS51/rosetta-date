import type { CanonicalToken } from './canonical'
import type { Dialect, Library } from './types'

/**
 * The dialect an endpoint parses through. A {@link Library} resolves to its
 * precomputed effective grammar; a bare {@link Dialect} is itself.
 *
 * @internal
 */
export function sourceDialect(endpoint: Dialect | Library): Dialect {
  return 'resolved' in endpoint ? endpoint.resolved.dialect : endpoint
}

/**
 * Whether the endpoint's grammar defines a token for `canonical`, ignoring any
 * library support narrowing. Distinguishes a field the grammar has no spelling
 * for (`unmappable`) from one the library gates (`unsupported-by-target`).
 *
 * @internal
 */
export function definesCanonical(endpoint: Dialect | Library, canonical: CanonicalToken): boolean {
  return sourceDialect(endpoint).tokens.some(rule => rule.canonical === canonical)
}
