import type { Dialect } from '../core/types'
import { Canonical } from '../core/canonical'

/**
 * Defines the C / POSIX `strftime` date-token grammar.
 *
 * @remarks
 * Scope: atomic, single-field `%` directives. Composite directives (`%T`, `%F`,
 * `%D`, `%R`, `%r`) expand to several fields and are outside this dialect.
 *
 * Syntax: a `directive` family. Every token is introduced by `%`, and all other
 * text, including letters, is literal. A literal `%` is written `%%`.
 *
 * Padding: `strftime` distinguishes zero-padding (`%d`, `%H`) from blank-padding
 * (`%e`, `%k`, `%l`), carried by the `2-digit` vs `space-padded` canonical styles.
 *
 * @see {@link https://pubs.opengroup.org/onlinepubs/9699919799/functions/strftime.html | POSIX `strftime`}
 */
export const strftime: Dialect = {
  name: 'strftime',
  syntax: { kind: 'directive', marker: '%' },
  tokens: [
    // Year
    { token: '%Y', canonical: Canonical.YearNumeric },
    { token: '%y', canonical: Canonical.YearTwoDigit },
    { token: '%G', canonical: Canonical.WeekYearNumericIso },

    // Month
    { token: '%m', canonical: Canonical.MonthTwoDigit },
    { token: '%B', canonical: Canonical.MonthWide },
    { token: '%b', canonical: Canonical.MonthAbbreviated },
    { token: '%h', canonical: Canonical.MonthAbbreviated },

    // Day
    { token: '%d', canonical: Canonical.DayOfMonthTwoDigit },
    { token: '%e', canonical: Canonical.DayOfMonthSpacePadded },
    { token: '%j', canonical: Canonical.DayOfYearThreeDigit },

    // Week / weekday number
    { token: '%V', canonical: Canonical.WeekOfYearTwoDigitIso },
    { token: '%u', canonical: Canonical.WeekdayNumericIso },
    { token: '%w', canonical: Canonical.WeekdayNumeric },

    // Weekday name
    { token: '%A', canonical: Canonical.WeekdayWide },
    { token: '%a', canonical: Canonical.WeekdayAbbreviated },

    // Day period (AM/PM)
    { token: '%p', canonical: Canonical.DayPeriodAbbreviated },

    // Hour — `%H`/`%I` zero-pad, `%k`/`%l` blank-pad
    { token: '%H', canonical: Canonical.HourTwoDigitH23 },
    { token: '%k', canonical: Canonical.HourSpacePaddedH23 },
    { token: '%I', canonical: Canonical.HourTwoDigitH12 },
    { token: '%l', canonical: Canonical.HourSpacePaddedH12 },

    // Minute / second
    { token: '%M', canonical: Canonical.MinuteTwoDigit },
    { token: '%S', canonical: Canonical.SecondTwoDigit },

    // Time zone / offset
    { token: '%Z', canonical: Canonical.TimezoneAbbreviated },
    { token: '%z', canonical: Canonical.OffsetWithoutColon },

    // Unix epoch
    { token: '%s', canonical: Canonical.EpochSeconds },

    // Localized presets — deferred to the locale, mapped preset ↔ preset
    { token: '%c', canonical: Canonical.LocalizedDateTimeFull },
    { token: '%x', canonical: Canonical.LocalizedDateShort },
    { token: '%X', canonical: Canonical.LocalizedTimeMedium },
  ],
}
