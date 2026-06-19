import type { Library } from '../core/types'
import { dateFns } from './date-fns'
import { dayjs } from './dayjs'
import { momentjs } from './momentjs'

/**
 * Every built-in library, keyed by name. Adding a library means adding one entry
 * here (and its file) — the engine needs nothing else.
 */
export const libraries = {
  'momentjs': momentjs,
  'dayjs': dayjs,
  'date-fns': dateFns,
} satisfies Record<string, Library>

/**
 * The name of a supported library, e.g. `'momentjs'` or `'date-fns'`. Derived
 * from {@link libraries} so it stays in sync automatically.
 */
export type LibraryName = keyof typeof libraries

/**
 * Resolve a library by name for the dynamic, string-driven path.
 */
export function getLibrary(name: LibraryName): Library {
  return libraries[name]
}
