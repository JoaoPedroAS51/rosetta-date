import type { Dialect } from '../core/types'
import { Canonical } from '../core/canonical'

/**
 * Defines the Unicode LDML date-token grammar.
 *
 * @remarks
 * Scope: supported non-ordinal date field symbols from UTS #35 / LDML.
 *
 * Literals: text is quoted with `'...'`. Use `''` to emit one apostrophe.
 *
 * Rendering: when aliases share a canonical token, the first mapping is emitted.
 *
 * Case sensitivity: `y` and `Y` are different fields, as are `d` and `D`.
 *
 * @see {@link https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table | Unicode UTS #35 Date Field Symbol Table}
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

    // Quarter
    { token: 'Q', canonical: Canonical.QuarterNumeric },

    // Month
    { token: 'M', canonical: Canonical.MonthNumeric },
    { token: 'MM', canonical: Canonical.MonthTwoDigit },
    { token: 'MMM', canonical: Canonical.MonthAbbreviated },
    { token: 'MMMM', canonical: Canonical.MonthWide },
    { token: 'MMMMM', canonical: Canonical.MonthNarrow },

    // Week of year (local)
    { token: 'w', canonical: Canonical.WeekOfYearNumeric },
    { token: 'ww', canonical: Canonical.WeekOfYearTwoDigit },

    // Day of month
    { token: 'd', canonical: Canonical.DayOfMonthNumeric },
    { token: 'dd', canonical: Canonical.DayOfMonthTwoDigit },

    // Day of year, gated in date-fns by useAdditionalDayOfYearTokens
    { token: 'D', canonical: Canonical.DayOfYearNumeric },
    { token: 'DD', canonical: Canonical.DayOfYearTwoDigit },
    { token: 'DDD', canonical: Canonical.DayOfYearThreeDigit },

    // Weekday name (formatting `E`)
    { token: 'EEE', canonical: Canonical.WeekdayAbbreviated },
    { token: 'E', canonical: Canonical.WeekdayAbbreviated },
    { token: 'EE', canonical: Canonical.WeekdayAbbreviated },
    { token: 'EEEE', canonical: Canonical.WeekdayWide },
    { token: 'EEEEE', canonical: Canonical.WeekdayNarrow },
    { token: 'EEEEEE', canonical: Canonical.WeekdayShort },

    // Weekday number — local (`e`); ISO (`i`) is a date-fns extension
    { token: 'e', canonical: Canonical.WeekdayNumeric },

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

    // Epoch (`t`/`T`) and the localized presets (`P…`/`p…`) are date-fns
    // extensions, not UTS#35 — they are defined on the `dateFns` library.
  ],
}
