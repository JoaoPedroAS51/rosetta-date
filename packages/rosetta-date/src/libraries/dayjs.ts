import type { Library } from '../core/types'
import { Canonical } from '../core/canonical'
import { defineLibrary } from '../core/library'
import { moment } from '../dialects/moment'

/**
 * Defines the `Day.js` rendering target.
 *
 * @remarks
 * Base grammar: `moment`.
 *
 * Extensions: none. Plugin-provided spellings are modeled as supported canonical
 * fields of the base grammar.
 *
 * Support model: `supports` lists the canonical fields `Day.js` renders with the
 * core formatter plus `AdvancedFormat` and `LocalizedFormat`.
 *
 * Unsupported fields include era, month ordinal, quarter ordinal, day-of-year,
 * ISO week ordinal, ISO weekday number, sub-`SSS` fractions, and two-digit
 * week-years.
 *
 * @see {@link https://day.js.org/docs/en/display/format | `Day.js` format documentation}
 * @see {@link https://day.js.org/docs/en/plugin/advanced-format | `Day.js` `AdvancedFormat` plugin}
 * @see {@link https://day.js.org/docs/en/plugin/localized-format | `Day.js` `LocalizedFormat` plugin}
 */
export const dayjs: Library = defineLibrary({
  name: 'dayjs',
  dialect: moment,
  supports: new Set([
    // Year
    Canonical.YearNumeric,
    Canonical.YearTwoDigit,
    Canonical.WeekYearNumeric,
    Canonical.IsoWeekYearNumeric,

    // Quarter / month
    Canonical.QuarterNumeric,
    Canonical.MonthNumeric,
    Canonical.MonthTwoDigit,
    Canonical.MonthAbbreviated,
    Canonical.MonthWide,

    // Week of year
    Canonical.WeekOfYearNumeric,
    Canonical.WeekOfYearTwoDigit,
    Canonical.WeekOfYearOrdinal,
    Canonical.IsoWeekOfYearNumeric,
    Canonical.IsoWeekOfYearTwoDigit,

    // Day of month
    Canonical.DayOfMonthNumeric,
    Canonical.DayOfMonthTwoDigit,
    Canonical.DayOfMonthOrdinal,

    // Weekday
    Canonical.WeekdayWide,
    Canonical.WeekdayAbbreviated,
    Canonical.WeekdayShort,
    Canonical.WeekdayNumeric,

    // Day period
    Canonical.DayPeriodAbbreviated,

    // Hour / minute / second
    Canonical.Hour24Numeric,
    Canonical.Hour24TwoDigit,
    Canonical.Hour12Numeric,
    Canonical.Hour12TwoDigit,
    Canonical.Hour24From1Numeric,
    Canonical.Hour24From1TwoDigit,
    Canonical.MinuteNumeric,
    Canonical.MinuteTwoDigit,
    Canonical.SecondNumeric,
    Canonical.SecondTwoDigit,
    Canonical.FractionalSecond3,

    // Time zone / offset / epoch
    Canonical.TimezoneAbbreviated,
    Canonical.OffsetWithColon,
    Canonical.OffsetWithoutColon,
    Canonical.EpochSeconds,
    Canonical.EpochMilliseconds,

    // Localized presets
    Canonical.LocalizedDateShort,
    Canonical.LocalizedDateMedium,
    Canonical.LocalizedDateLong,
    Canonical.LocalizedTimeShort,
    Canonical.LocalizedTimeMedium,
    Canonical.LocalizedDateTimeMedium,
    Canonical.LocalizedDateTimeLong,
    Canonical.LocalizedDateTimeFull,
  ]),
})
