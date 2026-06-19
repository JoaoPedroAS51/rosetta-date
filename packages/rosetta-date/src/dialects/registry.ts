import type { Dialect } from '../core/types'
import { ldml } from './ldml'
import { moment } from './moment'

/**
 * Every built-in dialect, keyed by name. Adding a dialect means adding one entry
 * here (and its table file) — the engine needs nothing else.
 */
export const dialects = {
  moment,
  ldml,
} satisfies Record<string, Dialect>

/**
 * The name of a supported dialect, e.g. `'moment'` or `'ldml'`. Derived from
 * {@link dialects} so it stays in sync automatically.
 */
export type DialectName = keyof typeof dialects

/**
 * Resolve a dialect by name for the dynamic, string-driven path.
 */
export function getDialect(name: DialectName): Dialect {
  return dialects[name]
}
