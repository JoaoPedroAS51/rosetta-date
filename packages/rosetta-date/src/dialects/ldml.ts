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
 * Stand-alone: the named forms (`LLL`/`qqq`/`ccc`) are distinct canonicals, but
 * the numeric forms (`L`/`q`/`c`) alias the formatting numerics, since a number
 * carries no stand-alone inflection.
 *
 * Case sensitivity: `y` and `Y` are different fields, as are `d` and `D`.
 *
 * @see {@link https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table | Unicode UTS #35 Date Field Symbol Table}
 */
export const ldml: Dialect = {
  name: 'ldml',
  syntax: { kind: 'delimited', open: '\'', close: '\'', escapedDelimiter: '\'\'' },
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

    // Week-numbering year
    { token: 'YYYY', canonical: Canonical.WeekYearNumeric },
    { token: 'Y', canonical: Canonical.WeekYearNumeric },
    { token: 'YYY', canonical: Canonical.WeekYearNumeric },
    { token: 'YY', canonical: Canonical.WeekYearTwoDigit },

    // Quarter
    { token: 'Q', canonical: Canonical.QuarterNumeric },
    { token: 'QQ', canonical: Canonical.QuarterTwoDigit },
    { token: 'QQQ', canonical: Canonical.QuarterAbbreviated },
    { token: 'QQQQ', canonical: Canonical.QuarterWide },
    { token: 'QQQQQ', canonical: Canonical.QuarterNarrow },
    { token: 'q', canonical: Canonical.QuarterNumeric },
    { token: 'qq', canonical: Canonical.QuarterTwoDigit },
    { token: 'qqq', canonical: Canonical.QuarterAbbreviatedStandalone },
    { token: 'qqqq', canonical: Canonical.QuarterWideStandalone },
    { token: 'qqqqq', canonical: Canonical.QuarterNarrowStandalone },

    // Month
    { token: 'M', canonical: Canonical.MonthNumeric },
    { token: 'MM', canonical: Canonical.MonthTwoDigit },
    { token: 'MMM', canonical: Canonical.MonthAbbreviated },
    { token: 'MMMM', canonical: Canonical.MonthWide },
    { token: 'MMMMM', canonical: Canonical.MonthNarrow },
    { token: 'L', canonical: Canonical.MonthNumeric },
    { token: 'LL', canonical: Canonical.MonthTwoDigit },
    { token: 'LLL', canonical: Canonical.MonthAbbreviatedStandalone },
    { token: 'LLLL', canonical: Canonical.MonthWideStandalone },
    { token: 'LLLLL', canonical: Canonical.MonthNarrowStandalone },

    // Week of year
    { token: 'w', canonical: Canonical.WeekOfYearNumeric },
    { token: 'ww', canonical: Canonical.WeekOfYearTwoDigit },

    // Day of month
    { token: 'd', canonical: Canonical.DayOfMonthNumeric },
    { token: 'dd', canonical: Canonical.DayOfMonthTwoDigit },

    // Day of year
    { token: 'D', canonical: Canonical.DayOfYearNumeric },
    { token: 'DD', canonical: Canonical.DayOfYearTwoDigit },
    { token: 'DDD', canonical: Canonical.DayOfYearThreeDigit },

    // Weekday name
    { token: 'EEE', canonical: Canonical.WeekdayAbbreviated },
    { token: 'E', canonical: Canonical.WeekdayAbbreviated },
    { token: 'EE', canonical: Canonical.WeekdayAbbreviated },
    { token: 'EEEE', canonical: Canonical.WeekdayWide },
    { token: 'EEEEE', canonical: Canonical.WeekdayNarrow },
    { token: 'EEEEEE', canonical: Canonical.WeekdayShort },
    { token: 'eee', canonical: Canonical.WeekdayAbbreviated },
    { token: 'eeee', canonical: Canonical.WeekdayWide },
    { token: 'eeeee', canonical: Canonical.WeekdayNarrow },
    { token: 'eeeeee', canonical: Canonical.WeekdayShort },
    { token: 'ccc', canonical: Canonical.WeekdayAbbreviatedStandalone },
    { token: 'cccc', canonical: Canonical.WeekdayWideStandalone },
    { token: 'ccccc', canonical: Canonical.WeekdayNarrowStandalone },
    { token: 'cccccc', canonical: Canonical.WeekdayShortStandalone },

    // Weekday number
    { token: 'e', canonical: Canonical.WeekdayNumeric },
    { token: 'ee', canonical: Canonical.WeekdayTwoDigit },
    { token: 'c', canonical: Canonical.WeekdayNumeric },
    { token: 'cc', canonical: Canonical.WeekdayTwoDigit },

    // Day period (AM/PM)
    { token: 'a', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'aa', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'aaa', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'aaaa', canonical: Canonical.DayPeriodWide },
    { token: 'aaaaa', canonical: Canonical.DayPeriodNarrow },

    // Hour
    { token: 'h', canonical: Canonical.HourNumericH12 },
    { token: 'hh', canonical: Canonical.HourTwoDigitH12 },
    { token: 'H', canonical: Canonical.HourNumericH23 },
    { token: 'HH', canonical: Canonical.HourTwoDigitH23 },
    { token: 'k', canonical: Canonical.HourNumericH24 },
    { token: 'kk', canonical: Canonical.HourTwoDigitH24 },
    { token: 'K', canonical: Canonical.HourNumericH11 },
    { token: 'KK', canonical: Canonical.HourTwoDigitH11 },

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

    // Epoch and localized presets are outside this UTS #35 subset.
  ],
}
