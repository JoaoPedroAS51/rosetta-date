import type { Dialect, Library } from './types'

/**
 * The dialect an endpoint parses through — a {@link Library} resolves to its
 * precomputed effective grammar, a bare {@link Dialect} is itself.
 *
 * @internal
 */
export function sourceDialect(endpoint: Dialect | Library): Dialect {
  return 'resolved' in endpoint ? endpoint.resolved.dialect : endpoint
}
