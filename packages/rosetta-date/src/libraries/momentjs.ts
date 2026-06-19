import type { Library } from '../core/types'
import { defineLibrary } from '../core/library'
import { moment } from '../dialects/moment'

/**
 * Defines the `Moment.js` rendering target.
 *
 * @remarks
 * Base grammar: `moment`.
 *
 * Extensions: none.
 *
 * Support model: every token in the base grammar is considered renderable, so
 * `supports` is omitted.
 *
 * Runtime behavior: some tokens still require `Moment.js` plugins or companion
 * packages at runtime, such as timezone-name tokens with `moment-timezone`.
 *
 * @see {@link https://momentjs.com/docs/#/displaying/format/ | `Moment.js` format tokens}
 * @see {@link https://momentjs.com/timezone/docs/ | `Moment Timezone` documentation}
 */
export const momentjs: Library = defineLibrary({
  name: 'momentjs',
  dialect: moment,
})
