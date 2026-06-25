import type { Dialect } from '../core/types'
import { Canonical } from '../core/canonical'

/**
 * Defines the Moment.js-style date-token grammar.
 *
 * @remarks
 * Scope: supported format tokens from the Moment.js grammar family.
 *
 * Literals: text is wrapped with `[ ... ]`. The closing bracket has no in-band
 * escape.
 *
 * Rendering: when aliases share a canonical token, the first mapping is emitted.
 *
 * Case sensitivity: `YYYY` is a calendar-year token in this grammar.
 *
 * @see {@link https://momentjs.com/docs/#/displaying/format/ | Moment.js format tokens}
 */
export const moment: Dialect = {
  name: 'moment',
  syntax: { kind: 'delimited', open: '[', close: ']' },
  tokens: [
    // Calendar year
    { token: 'YYYY', canonical: Canonical.YearNumeric },
    { token: 'Y', canonical: Canonical.YearNumeric },
    { token: 'YY', canonical: Canonical.YearTwoDigit },

    // Week-numbering year
    { token: 'gggg', canonical: Canonical.WeekYearNumeric },
    { token: 'gg', canonical: Canonical.WeekYearTwoDigit },
    { token: 'GGGG', canonical: Canonical.WeekYearNumericIso },
    { token: 'GG', canonical: Canonical.WeekYearTwoDigitIso },

    // Era
    { token: 'N', canonical: Canonical.EraAbbreviated },
    { token: 'NN', canonical: Canonical.EraAbbreviated },
    { token: 'NNN', canonical: Canonical.EraAbbreviated },
    { token: 'NNNN', canonical: Canonical.EraWide },
    { token: 'NNNNN', canonical: Canonical.EraNarrow },

    // Quarter
    { token: 'Q', canonical: Canonical.QuarterNumeric },
    { token: 'Qo', canonical: Canonical.QuarterOrdinal },

    // Month
    { token: 'M', canonical: Canonical.MonthNumeric },
    { token: 'MM', canonical: Canonical.MonthTwoDigit },
    { token: 'Mo', canonical: Canonical.MonthOrdinal },
    { token: 'MMM', canonical: Canonical.MonthAbbreviated },
    { token: 'MMMM', canonical: Canonical.MonthWide },

    // Week of year
    { token: 'w', canonical: Canonical.WeekOfYearNumeric },
    { token: 'ww', canonical: Canonical.WeekOfYearTwoDigit },
    { token: 'wo', canonical: Canonical.WeekOfYearOrdinal },
    { token: 'W', canonical: Canonical.WeekOfYearNumericIso },
    { token: 'WW', canonical: Canonical.WeekOfYearTwoDigitIso },
    { token: 'Wo', canonical: Canonical.WeekOfYearOrdinalIso },

    // Day of month
    { token: 'D', canonical: Canonical.DayOfMonthNumeric },
    { token: 'DD', canonical: Canonical.DayOfMonthTwoDigit },
    { token: 'Do', canonical: Canonical.DayOfMonthOrdinal },

    // Day of year
    { token: 'DDD', canonical: Canonical.DayOfYearNumeric },
    { token: 'DDDD', canonical: Canonical.DayOfYearThreeDigit },
    { token: 'DDDo', canonical: Canonical.DayOfYearOrdinal },

    // Weekday name / number
    { token: 'dddd', canonical: Canonical.WeekdayWide },
    { token: 'ddd', canonical: Canonical.WeekdayAbbreviated },
    { token: 'dd', canonical: Canonical.WeekdayShort },
    { token: 'd', canonical: Canonical.WeekdayNumeric },
    { token: 'E', canonical: Canonical.WeekdayNumericIso },

    // Day period (AM/PM)
    { token: 'A', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'a', canonical: Canonical.DayPeriodAbbreviatedLower },

    // Hour
    { token: 'H', canonical: Canonical.HourNumericH23 },
    { token: 'HH', canonical: Canonical.HourTwoDigitH23 },
    { token: 'h', canonical: Canonical.HourNumericH12 },
    { token: 'hh', canonical: Canonical.HourTwoDigitH12 },
    { token: 'k', canonical: Canonical.HourNumericH24 },
    { token: 'kk', canonical: Canonical.HourTwoDigitH24 },

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
    { token: 'z', canonical: Canonical.TimezoneAbbreviated },
    { token: 'zz', canonical: Canonical.TimezoneAbbreviated },
    { token: 'Z', canonical: Canonical.OffsetWithColon },
    { token: 'ZZ', canonical: Canonical.OffsetWithoutColon },

    // Unix epoch
    { token: 'X', canonical: Canonical.EpochSeconds },
    { token: 'x', canonical: Canonical.EpochMilliseconds },

    // Localized presets
    { token: 'L', canonical: Canonical.LocalizedDateShort },
    { token: 'll', canonical: Canonical.LocalizedDateMedium },
    { token: 'LL', canonical: Canonical.LocalizedDateLong },
    { token: 'LT', canonical: Canonical.LocalizedTimeShort },
    { token: 'LTS', canonical: Canonical.LocalizedTimeMedium },
    { token: 'lll', canonical: Canonical.LocalizedDateTimeMedium },
    { token: 'LLL', canonical: Canonical.LocalizedDateTimeLong },
    { token: 'LLLL', canonical: Canonical.LocalizedDateTimeFull },
  ],
}
