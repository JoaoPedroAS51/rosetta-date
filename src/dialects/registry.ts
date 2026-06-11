import type { Dialect } from '../core/types'
import { moment } from './moment'
import { unicode } from './unicode'

/**
 * Every built-in dialect, keyed by name. Adding a dialect means adding one entry
 * here (and its table file) — the engine needs nothing else.
 */
export const dialects = {
  moment,
  unicode,
} satisfies Record<string, Dialect>

/**
 * The name of a supported dialect, e.g. `'moment'` or `'unicode'`. Derived from
 * {@link dialects} so it stays in sync automatically.
 */
export type DialectName = keyof typeof dialects

/**
 * Resolve a dialect by name. Returns `undefined` for an unknown name so callers
 * can decide how to report it.
 */
export function getDialect(name: DialectName): Dialect {
  return dialects[name]
}
