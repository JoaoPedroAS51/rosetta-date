import type { Library } from '../core/types'
import { dateFns } from './date-fns'
import { dayjs } from './dayjs'
import { momentjs } from './momentjs'

/** Every built-in library, keyed by name. */
export const libraries = {
  'momentjs': momentjs,
  'dayjs': dayjs,
  'date-fns': dateFns,
} satisfies Record<string, Library>

/** The name of a built-in library. */
export type LibraryName = keyof typeof libraries

/** Resolve a built-in library by name. */
export function getLibrary(name: LibraryName): Library {
  return libraries[name]
}
