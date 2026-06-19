import type { Library } from '../core/types'
import { defineLibrary } from '../core/library'
import { moment } from '../dialects/moment'

// Day.js core formatter — the tokens recognized with no plugin loaded.
const core = [
  'YY',
  'YYYY',
  'M',
  'MM',
  'MMM',
  'MMMM',
  'D',
  'DD',
  'd',
  'dd',
  'ddd',
  'dddd',
  'H',
  'HH',
  'h',
  'hh',
  'm',
  'mm',
  's',
  'ss',
  'SSS',
  'Z',
  'ZZ',
  'A',
  'a',
]

// The `AdvancedFormat` plugin adds these (and only these) extra spellings.
const advancedFormat = [
  'Q',
  'Do',
  'w',
  'wo',
  'ww',
  'W',
  'WW',
  'k',
  'kk',
  'gggg',
  'GGGG',
  'X',
  'x',
  'z',
]

// The `LocalizedFormat` plugin adds the `L…` presets Day.js can render.
const localizedFormat = [
  'L',
  'll',
  'LL',
  'LT',
  'LTS',
  'lll',
  'LLL',
  'LLLL',
]

/**
 * Defines the `Day.js` rendering target.
 *
 * @remarks
 * Base grammar: `moment`.
 *
 * Extensions: none. Plugin-provided tokens are modeled as supported tokens from
 * the base grammar.
 *
 * Support model: `supports` contains the Day.js core formatter plus common
 * `AdvancedFormat` and `LocalizedFormat` plugin tokens. Tokens outside this set
 * are unsupported by this target.
 *
 * @see {@link https://day.js.org/docs/en/display/format | `Day.js` format documentation}
 * @see {@link https://day.js.org/docs/en/plugin/advanced-format | `Day.js` `AdvancedFormat` plugin}
 * @see {@link https://day.js.org/docs/en/plugin/localized-format | `Day.js` `LocalizedFormat` plugin}
 */
export const dayjs: Library = defineLibrary({
  name: 'dayjs',
  dialect: moment,
  supports: new Set([...core, ...advancedFormat, ...localizedFormat]),
})
