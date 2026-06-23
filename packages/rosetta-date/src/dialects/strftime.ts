import type { Dialect } from '../core/types'
import { Canonical } from '../core/canonical'

/**
 * Defines the C / POSIX `strftime` date-token grammar.
 *
 * @remarks
 * Scope: the single-field `%` directives plus composite directives. `%T`, `%R`,
 * `%F`, `%D`, and `%r` expand to sub-patterns of atomic directives. `%n` and
 * `%t` expand to literal newline and tab characters. All composites expand on
 * parse and normalize to their expansion on render.
 *
 * Syntax: a `directive` family. Every token is introduced by `%`, and all other
 * text, including letters, is literal. A literal `%` is written `%%`.
 *
 * Padding: `strftime` distinguishes zero-padding (`%d`, `%H`) from blank-padding
 * (`%e`, `%k`, `%l`), carried by the `2-digit` vs `space-padded` canonical
 * styles. The glibc padding flags `%-X` and `%0X` are recognized as unpadded and
 * explicit-zero aliases. The blank-padding flag `%_X` is outside this dialect
 * subset except for the explicit `%e`, `%k`, and `%l` directives.
 *
 * @see {@link https://pubs.opengroup.org/onlinepubs/9699919799/functions/strftime.html | POSIX `strftime`}
 * @see {@link https://sourceware.org/glibc/manual/latest/html_node/Formatting-Calendar-Time.html | glibc `strftime` extensions}
 */
export const strftime: Dialect = {
  name: 'strftime',
  syntax: { kind: 'directive', marker: '%' },
  tokens: [
    // Year
    { token: '%Y', canonical: Canonical.YearNumeric },
    { token: '%y', canonical: Canonical.YearTwoDigit },
    { token: '%C', canonical: Canonical.CenturyTwoDigit },
    { token: '%G', canonical: Canonical.WeekYearNumericIso },
    { token: '%g', canonical: Canonical.WeekYearTwoDigitIso },

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
    { token: '%P', canonical: Canonical.DayPeriodAbbreviatedLower },

    // Hour: `%H`/`%I` zero-pad, `%k`/`%l` blank-pad
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

    // Localized presets: deferred to the locale, mapped preset to preset
    { token: '%c', canonical: Canonical.LocalizedDateTimeFull },
    { token: '%x', canonical: Canonical.LocalizedDateShort },
    { token: '%X', canonical: Canonical.LocalizedTimeMedium },

    // Padding-flag variants (glibc): `%-X` maps to unpadded output, and `%0X`
    // maps to explicit zero-padding. Both are aliases of canonical fields the
    // core directives already cover. `%0X` normalizes to the primary spelling.
    { token: '%-d', canonical: Canonical.DayOfMonthNumeric },
    { token: '%0d', canonical: Canonical.DayOfMonthTwoDigit },
    { token: '%-m', canonical: Canonical.MonthNumeric },
    { token: '%0m', canonical: Canonical.MonthTwoDigit },
    { token: '%-H', canonical: Canonical.HourNumericH23 },
    { token: '%0H', canonical: Canonical.HourTwoDigitH23 },
    { token: '%-I', canonical: Canonical.HourNumericH12 },
    { token: '%0I', canonical: Canonical.HourTwoDigitH12 },
    { token: '%-M', canonical: Canonical.MinuteNumeric },
    { token: '%0M', canonical: Canonical.MinuteTwoDigit },
    { token: '%-S', canonical: Canonical.SecondNumeric },
    { token: '%0S', canonical: Canonical.SecondTwoDigit },
    { token: '%-j', canonical: Canonical.DayOfYearNumeric },
    { token: '%0j', canonical: Canonical.DayOfYearThreeDigit },
    { token: '%-V', canonical: Canonical.WeekOfYearNumericIso },
    { token: '%0V', canonical: Canonical.WeekOfYearTwoDigitIso },
    { token: '%0y', canonical: Canonical.YearTwoDigit },
    { token: '%0g', canonical: Canonical.WeekYearTwoDigitIso },
    { token: '%0C', canonical: Canonical.CenturyTwoDigit },
  ],
  // Composite directives: parse-time macros that expand to a sub-pattern on parse.
  // Rendering produces the expansion, never the composite, so `%T` normalizes to
  // `%H:%M:%S` on a round trip. `%n`/`%t` normalize to literal newline/tab
  // characters.
  composites: [
    { token: '%T', expandsTo: '%H:%M:%S' },
    { token: '%R', expandsTo: '%H:%M' },
    { token: '%F', expandsTo: '%Y-%m-%d' },
    { token: '%D', expandsTo: '%m/%d/%y' },
    { token: '%r', expandsTo: '%I:%M:%S %p' },
    { token: '%n', expandsTo: '\n' },
    { token: '%t', expandsTo: '\t' },
  ],
}
