import type { Library } from '../core/types'
import { Canonical } from '../core/canonical'
import { defineLibrary } from '../core/library'
import { ldml } from '../dialects/ldml'

/**
 * date-fns — the reference implementation of the `ldml` grammar. It renders the
 * whole effective grammar (dialect + `extends`), so `supports` is omitted.
 *
 * `extends` carries the tokens date-fns adds on top of pure UTS#35: the ordinal
 * `…o` forms (`do`/`Mo`/…), ISO week-year/week/weekday (`R`/`I`/`i`), epoch
 * (`t`/`T`), and the localized presets (`P`/`p`/`Pp…`).
 */
export const dateFns: Library = defineLibrary({
  name: 'date-fns',
  dialect: ldml,
  extends: [
    // Ordinal `…o` forms — moment/date-fns convention, not UTS#35
    { token: 'Qo', canonical: Canonical.QuarterOrdinal },
    { token: 'Mo', canonical: Canonical.MonthOrdinal },
    { token: 'wo', canonical: Canonical.WeekOfYearOrdinal },
    { token: 'do', canonical: Canonical.DayOfMonthOrdinal },
    { token: 'Do', canonical: Canonical.DayOfYearOrdinal },
    { token: 'Io', canonical: Canonical.IsoWeekOfYearOrdinal },

    // ISO week-numbering year
    { token: 'RRRR', canonical: Canonical.IsoWeekYearNumeric },
    { token: 'R', canonical: Canonical.IsoWeekYearNumeric },
    { token: 'RR', canonical: Canonical.IsoWeekYearTwoDigit },

    // ISO week of year
    { token: 'I', canonical: Canonical.IsoWeekOfYearNumeric },
    { token: 'II', canonical: Canonical.IsoWeekOfYearTwoDigit },

    // ISO day of week
    { token: 'i', canonical: Canonical.IsoWeekdayNumeric },

    // Unix epoch
    { token: 't', canonical: Canonical.EpochSeconds },
    { token: 'T', canonical: Canonical.EpochMilliseconds },

    // Localized presets — single locale-aware tokens (the `Pp…` combinations join
    // date and time with the locale's connector), mapped preset ↔ preset.
    { token: 'P', canonical: Canonical.LocalizedDateShort },
    { token: 'PP', canonical: Canonical.LocalizedDateMedium },
    { token: 'PPP', canonical: Canonical.LocalizedDateLong },
    { token: 'PPPP', canonical: Canonical.LocalizedDateFull },
    { token: 'p', canonical: Canonical.LocalizedTimeShort },
    { token: 'pp', canonical: Canonical.LocalizedTimeMedium },
    { token: 'ppp', canonical: Canonical.LocalizedTimeLong },
    { token: 'pppp', canonical: Canonical.LocalizedTimeFull },
    { token: 'Pp', canonical: Canonical.LocalizedDateTimeShort },
    { token: 'PPpp', canonical: Canonical.LocalizedDateTimeMedium },
    { token: 'PPPppp', canonical: Canonical.LocalizedDateTimeLong },
    { token: 'PPPPpppp', canonical: Canonical.LocalizedDateTimeFull },
  ],
})
