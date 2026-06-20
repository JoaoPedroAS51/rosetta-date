import type { Dialect } from '../core/types'
import { ldml } from './ldml'
import { moment } from './moment'
import { strftime } from './strftime'

/**
 * Every built-in dialect, keyed by name. Adding a dialect means adding one entry
 * here and its table file. The engine reads the registry data directly.
 */
export const dialects = {
  moment,
  ldml,
  strftime,
} satisfies Record<string, Dialect>

/**
 * The name of a supported dialect. Derived from {@link dialects} so it stays in
 * sync automatically.
 */
export type DialectName = keyof typeof dialects

/**
 * Resolve a dialect by name for the dynamic, string-driven path.
 */
export function getDialect(name: DialectName): Dialect {
  return dialects[name]
}
