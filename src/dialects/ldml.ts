import type { Dialect } from '../core/types'
import { Canonical } from '../core/canonical'

/**
 * The `ldml` dialect: the UTS#35 / LDML (Unicode Locale Data Markup Language)
 * date field symbols — the grammar date-fns (and Luxon, `java.time`, `Intl`, …)
 * implement. Literals are single-quoted (`'literal'`), and a doubled quote (`''`)
 * stands for one literal apostrophe.
 *
 * This is the grammar, not any one library: date-fns is a {@link Library} of it,
 * not its namesake. The table also carries date-fns's **extensions** beyond pure
 * UTS#35 — the localized presets (`P`/`p`/`Pp…`), epoch (`t`/`T`), and the ISO
 * helpers (`R`, `I`, `i`); a pure-LDML consumer (ICU, `java.time`) would treat
 * those as a separate extension layer.
 *
 * Mind the case-sensitive traps that the canonical model resolves:
 * - lowercase `y` is the calendar year; uppercase `Y` is the local
 *   week-numbering year (date-fns gates `Y`/`YYYY` behind a flag).
 * - lowercase `d` is day-of-month; uppercase `D` is day-of-year (also gated).
 *
 * Where several tokens share a canonical symbol the first row is the primary
 * spelling used when rendering *to* ldml.
 */
export const ldml: Dialect = {
  name: 'ldml',
  literal: { open: '\'', close: '\'', escapedDelimiter: '\'\'' },
  tokens: [
    // Era
    { token: 'GGG', canonical: Canonical.EraAbbreviated },
    { token: 'G', canonical: Canonical.EraAbbreviated },
    { token: 'GG', canonical: Canonical.EraAbbreviated },
    { token: 'GGGG', canonical: Canonical.EraWide },
    { token: 'GGGGG', canonical: Canonical.EraNarrow },

    // Calendar year
    { token: 'yyyy', canonical: Canonical.YearNumeric },
    { token: 'y', canonical: Canonical.YearNumeric },
    { token: 'yyy', canonical: Canonical.YearNumeric },
    { token: 'yy', canonical: Canonical.YearTwoDigit },

    // Week-numbering year (local), gated in date-fns by useAdditionalWeekYearTokens
    { token: 'YYYY', canonical: Canonical.WeekYearNumeric },
    { token: 'YY', canonical: Canonical.WeekYearTwoDigit },

    // Week-numbering year (ISO)
    { token: 'RRRR', canonical: Canonical.IsoWeekYearNumeric },
    { token: 'R', canonical: Canonical.IsoWeekYearNumeric },
    { token: 'RR', canonical: Canonical.IsoWeekYearTwoDigit },

    // Quarter
    { token: 'Q', canonical: Canonical.QuarterNumeric },
    { token: 'Qo', canonical: Canonical.QuarterOrdinal },

    // Month
    { token: 'M', canonical: Canonical.MonthNumeric },
    { token: 'MM', canonical: Canonical.MonthTwoDigit },
    { token: 'Mo', canonical: Canonical.MonthOrdinal },
    { token: 'MMM', canonical: Canonical.MonthAbbreviated },
    { token: 'MMMM', canonical: Canonical.MonthWide },
    { token: 'MMMMM', canonical: Canonical.MonthNarrow },

    // Week of year (local)
    { token: 'w', canonical: Canonical.WeekOfYearNumeric },
    { token: 'ww', canonical: Canonical.WeekOfYearTwoDigit },
    { token: 'wo', canonical: Canonical.WeekOfYearOrdinal },

    // Week of year (ISO) — date-fns extension `I`
    { token: 'I', canonical: Canonical.IsoWeekOfYearNumeric },
    { token: 'II', canonical: Canonical.IsoWeekOfYearTwoDigit },
    { token: 'Io', canonical: Canonical.IsoWeekOfYearOrdinal },

    // Day of month
    { token: 'd', canonical: Canonical.DayOfMonthNumeric },
    { token: 'dd', canonical: Canonical.DayOfMonthTwoDigit },
    { token: 'do', canonical: Canonical.DayOfMonthOrdinal },

    // Day of year, gated in date-fns by useAdditionalDayOfYearTokens
    { token: 'D', canonical: Canonical.DayOfYearNumeric },
    { token: 'DD', canonical: Canonical.DayOfYearTwoDigit },
    { token: 'DDD', canonical: Canonical.DayOfYearThreeDigit },
    { token: 'Do', canonical: Canonical.DayOfYearOrdinal },

    // Weekday name (formatting `E`)
    { token: 'EEE', canonical: Canonical.WeekdayAbbreviated },
    { token: 'E', canonical: Canonical.WeekdayAbbreviated },
    { token: 'EE', canonical: Canonical.WeekdayAbbreviated },
    { token: 'EEEE', canonical: Canonical.WeekdayWide },
    { token: 'EEEEE', canonical: Canonical.WeekdayNarrow },
    { token: 'EEEEEE', canonical: Canonical.WeekdayShort },

    // Weekday number — local (`e`) and ISO (`i`)
    { token: 'e', canonical: Canonical.WeekdayNumeric },
    { token: 'i', canonical: Canonical.IsoWeekdayNumeric },

    // Day period (AM/PM)
    { token: 'a', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'aa', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'aaa', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'aaaa', canonical: Canonical.DayPeriodWide },
    { token: 'aaaaa', canonical: Canonical.DayPeriodNarrow },

    // Hour
    { token: 'h', canonical: Canonical.Hour12Numeric },
    { token: 'hh', canonical: Canonical.Hour12TwoDigit },
    { token: 'H', canonical: Canonical.Hour24Numeric },
    { token: 'HH', canonical: Canonical.Hour24TwoDigit },
    { token: 'k', canonical: Canonical.Hour24From1Numeric },
    { token: 'kk', canonical: Canonical.Hour24From1TwoDigit },
    { token: 'K', canonical: Canonical.Hour11Numeric },
    { token: 'KK', canonical: Canonical.Hour11TwoDigit },

    // Minute / second
    { token: 'm', canonical: Canonical.MinuteNumeric },
    { token: 'mm', canonical: Canonical.MinuteTwoDigit },
    { token: 's', canonical: Canonical.SecondNumeric },
    { token: 'ss', canonical: Canonical.SecondTwoDigit },

    // Fractional second
    { token: 'S', canonical: Canonical.FractionalSecond1 },
    { token: 'SS', canonical: Canonical.FractionalSecond2 },
    { token: 'SSS', canonical: Canonical.FractionalSecond3 },

    // Time zone / offset
    { token: 'zzz', canonical: Canonical.TimezoneAbbreviated },
    { token: 'z', canonical: Canonical.TimezoneAbbreviated },
    { token: 'zz', canonical: Canonical.TimezoneAbbreviated },
    { token: 'xxx', canonical: Canonical.OffsetWithColon },
    { token: 'xx', canonical: Canonical.OffsetWithoutColon },

    // Unix epoch
    { token: 't', canonical: Canonical.EpochSeconds },
    { token: 'T', canonical: Canonical.EpochMilliseconds },

    // Localized presets — date-fns's `P…`/`p…` family. The combined `Pp…` tokens
    // are single locale-aware presets (date-fns joins date and time with the
    // locale's connector), so they map preset ↔ preset like the rest.
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
}
