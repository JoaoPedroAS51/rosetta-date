import type { Library } from '../core/types'
import { Canonical } from '../core/canonical'
import { defineLibrary } from '../core/library'
import { ldml } from '../dialects/ldml'

/**
 * Defines the `date-fns` rendering target.
 *
 * @remarks
 * Base grammar: `ldml`.
 *
 * Extensions: adds ordinal forms specific to `date-fns`
 * (`Qo`/`Mo`/`wo`/`do`/`Do`/`Io`), ISO week-year/week/weekday tokens
 * (`R`/`I`/`i`), epoch tokens (`t`/`T`), and localized preset tokens
 * (`P`/`p`/`Pp...`).
 *
 * Support model: every token in the effective grammar is considered renderable,
 * so `supports` is omitted.
 *
 * @see {@link https://date-fns.org/docs/format | `date-fns` format documentation}
 * @see {@link https://github.com/date-fns/date-fns/blob/main/docs/unicodeTokens.md | `date-fns` Unicode token notes}
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
