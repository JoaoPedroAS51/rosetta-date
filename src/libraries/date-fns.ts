import type { Library } from '../core/types'
import { defineLibrary } from '../core/library'
import { ldml } from '../dialects/ldml'

/**
 * date-fns — the reference implementation of the `ldml` grammar. It renders the
 * whole dialect, so `supports` is omitted. A handful of tokens render only when
 * an option is enabled; those caveats live in `notes` (informational only).
 */
export const dateFns: Library = defineLibrary({
  name: 'date-fns',
  dialect: ldml,
  notes: new Map([
    ['YYYY', 'local week-numbering year; needs useAdditionalWeekYearTokens'],
    ['YY', 'local week-numbering year; needs useAdditionalWeekYearTokens'],
    ['D', 'day of year; needs useAdditionalDayOfYearTokens'],
    ['DD', 'day of year; needs useAdditionalDayOfYearTokens'],
  ]),
})
