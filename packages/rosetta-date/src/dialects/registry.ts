import type { Dialect } from '../core/types'
import { ldml } from './ldml'
import { moment } from './moment'
import { strftime } from './strftime'

/** Every built-in dialect, keyed by name. */
export const dialects = {
  moment,
  ldml,
  strftime,
} satisfies Record<string, Dialect>

/** The name of a built-in dialect. */
export type DialectName = keyof typeof dialects

/** Resolve a built-in dialect by name. */
export function getDialect(name: DialectName): Dialect {
  return dialects[name]
}
