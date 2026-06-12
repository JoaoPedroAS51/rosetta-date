import type { Dialect } from '../core/types'
import { Canonical } from '../core/canonical'

/**
 * The `moment` dialect: the Moment.js-style token grammar. It is the *grammar*,
 * lib-agnostic and maximal — the union of everything a tool in this family could
 * spell. Concrete tools live in `src/libraries/` (e.g. `momentjs`, `dayjs`) and
 * declare which subset of this grammar they actually render. Literals are
 * bracketed (`[literal]`); there is no in-band escape for the closing bracket.
 *
 * Where several tokens share a canonical symbol the first row is the primary
 * spelling used when rendering *to* moment.
 *
 * Note the deliberate `YYYY → year/numeric` mapping: in moment, capital `Y` is
 * the *calendar* year (unlike LDML, where capital `Y` is the week-numbering
 * year). Routing through the canonical model is what keeps that straight.
 */
export const moment: Dialect = {
  name: 'moment',
  literal: { open: '[', close: ']' },
  tokens: [
    // Calendar year
    { token: 'YYYY', canonical: Canonical.YearNumeric },
    { token: 'Y', canonical: Canonical.YearNumeric },
    { token: 'YY', canonical: Canonical.YearTwoDigit },

    // Week-numbering year
    { token: 'gggg', canonical: Canonical.WeekYearNumeric },
    { token: 'gg', canonical: Canonical.WeekYearTwoDigit },
    { token: 'GGGG', canonical: Canonical.IsoWeekYearNumeric },
    { token: 'GG', canonical: Canonical.IsoWeekYearTwoDigit },

    // Era — moment's narrow (`NNNNN`) renders the abbreviation, not a 1-char form
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
    { token: 'W', canonical: Canonical.IsoWeekOfYearNumeric },
    { token: 'WW', canonical: Canonical.IsoWeekOfYearTwoDigit },
    { token: 'Wo', canonical: Canonical.IsoWeekOfYearOrdinal },

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
    { token: 'E', canonical: Canonical.IsoWeekdayNumeric },

    // Day period (AM/PM) — moment encodes case, not width
    { token: 'A', canonical: Canonical.DayPeriodAbbreviated },
    { token: 'a', canonical: Canonical.DayPeriodAbbreviated },

    // Hour
    { token: 'H', canonical: Canonical.Hour24Numeric },
    { token: 'HH', canonical: Canonical.Hour24TwoDigit },
    { token: 'h', canonical: Canonical.Hour12Numeric },
    { token: 'hh', canonical: Canonical.Hour12TwoDigit },
    { token: 'k', canonical: Canonical.Hour24From1Numeric },
    { token: 'kk', canonical: Canonical.Hour24From1TwoDigit },

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
  ],
}
