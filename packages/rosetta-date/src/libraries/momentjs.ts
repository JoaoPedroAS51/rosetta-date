import type { Library } from '../core/types'
import { defineLibrary } from '../core/library'
import { moment } from '../dialects/moment'

/**
 * Defines the `Moment.js` rendering target.
 *
 * Base grammar: `moment`.
 *
 * Extensions: none.
 *
 * Runtime behavior: timezone-name tokens require `moment-timezone`.
 *
 * @see {@link https://momentjs.com/docs/#/displaying/format/ | `Moment.js` format tokens}
 * @see {@link https://momentjs.com/timezone/docs/ | `Moment Timezone` documentation}
 */
export const momentjs: Library = defineLibrary({
  name: 'momentjs',
  dialect: moment,
})
