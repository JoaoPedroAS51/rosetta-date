import type { Library } from '../core/types'
import { defineLibrary } from '../core/library'
import { moment } from '../dialects/moment'

/**
 * Moment.js — the reference implementation of the `moment` grammar. It renders
 * the whole dialect, so `supports` is omitted (no subset to restrict to).
 */
export const momentjs: Library = defineLibrary({
  name: 'momentjs',
  dialect: moment,
})
