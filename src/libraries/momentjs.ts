import type { Library } from '../core/types'
import { defineLibrary } from '../core/library'
import { moment } from '../dialects/moment'

/**
 * Moment.js — the reference implementation of the `moment` grammar. It renders
 * the whole dialect, so `supports` is omitted. Its one conditional token is the
 * zone abbreviation `z`, which is empty unless `moment-timezone` is loaded; the
 * `capabilities` map marks it so `assume: { env: [...] }` can flag it.
 */
export const momentjs: Library = defineLibrary({
  name: 'momentjs',
  dialect: moment,
  capabilities: new Map([
    ['z', { env: 'moment-timezone' }],
  ]),
})
