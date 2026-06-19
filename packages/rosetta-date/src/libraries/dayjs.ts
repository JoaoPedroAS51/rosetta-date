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

// The AdvancedFormat plugin adds these (and only these) extra spellings.
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

// The LocalizedFormat plugin adds the `L…` presets Day.js can render.
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
 * Day.js — speaks the `moment` grammar but implements only a subset. Tokens it
 * does not recognize are *mangled* at runtime (`Mo` → `6o`, `DDD` → `077`), so
 * converting *to* `dayjs` routes them through the unsupported-token policy rather
 * than emitting something broken.
 *
 * Not listed (and therefore flagged): the era (`N…`), ordinals beyond `Do`/`wo`
 * (`Mo`, `Qo`, `Wo`, `DDDo`), day-of-year (`DDD`, `DDDD`), the locale/ISO weekday
 * numbers (`e`, `E`), sub-`SSS` fractions (`S`, `SS`), and 2-digit week-years
 * (`gg`, `GG`).
 *
 * `supports` is everything Day.js can render with the common plugins (the core
 * formatter plus AdvancedFormat and LocalizedFormat).
 */
export const dayjs: Library = defineLibrary({
  name: 'dayjs',
  dialect: moment,
  supports: new Set([...core, ...advancedFormat, ...localizedFormat]),
})
