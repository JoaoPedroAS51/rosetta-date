/**
 * Defines the canonical date-field vocabulary used between dialects.
 *
 * @remarks
 * Purpose: each member names a date-field semantic plus its representation,
 * independent of any concrete token grammar.
 *
 * Usage: dialects and library extensions map each token spelling to one
 * of these members through `TokenRule.canonical`. Prefer named members over raw
 * string values.
 *
 * Grammar: values use `field/style[/qualifier...]`.
 *
 * A `qualifier` refines a base `field/style` pair. Examples include `iso` for
 * week-numbering rules, hour-cycle qualifiers such as `h11`/`h12`/`h23`/`h24`,
 * `standalone` for grammatical context, and presentation qualifiers such as
 * `space-padded` (fill) and `lower` (case). No qualifier means the default form.
 *
 * Qualifier order is part of a value's identity, so it follows a fixed
 * precedence: identity qualifiers that change the rendered value (`iso`, the hour
 * cycle, `standalone`) come before presentation qualifiers that only change its
 * surface (`space-padded`, `lower`) — e.g. `hour/2-digit/h23/space-padded`, never
 * `hour/2-digit/space-padded/h23`. This keeps each meaning a single canonical
 * string, so dialects never disagree on a value's spelling.
 *
 * Member names are PascalCase names derived from their value segments, so names
 * and values stay aligned: `week-of-year/ordinal/iso` maps to
 * `WeekOfYearOrdinalIso`.
 *
 * Stability: values are stable identifiers. Adding a member is a minor, additive
 * change. Renaming or removing a member is breaking.
 */
export const Canonical = {
  // Era — e.g. AD / Anno Domini
  EraAbbreviated: 'era/abbreviated',
  EraWide: 'era/wide',
  EraNarrow: 'era/narrow',

  // Calendar year
  YearNumeric: 'year/numeric',
  YearTwoDigit: 'year/2-digit',

  // Century: high-order two digits of the year (2026 -> 20)
  CenturyTwoDigit: 'century/2-digit',

  // Week-numbering year (the year that owns a given ISO/locale week)
  WeekYearNumeric: 'week-year/numeric',
  WeekYearTwoDigit: 'week-year/2-digit',
  WeekYearNumericIso: 'week-year/numeric/iso',
  WeekYearTwoDigitIso: 'week-year/2-digit/iso',

  // Quarter
  QuarterNumeric: 'quarter/numeric',
  QuarterTwoDigit: 'quarter/2-digit',
  QuarterOrdinal: 'quarter/ordinal',
  QuarterAbbreviated: 'quarter/abbreviated',
  QuarterWide: 'quarter/wide',
  QuarterNarrow: 'quarter/narrow',
  QuarterAbbreviatedStandalone: 'quarter/abbreviated/standalone',
  QuarterWideStandalone: 'quarter/wide/standalone',
  QuarterNarrowStandalone: 'quarter/narrow/standalone',

  // Month
  MonthNumeric: 'month/numeric',
  MonthTwoDigit: 'month/2-digit',
  MonthTwoDigitSpacePadded: 'month/2-digit/space-padded',
  MonthOrdinal: 'month/ordinal',
  MonthAbbreviated: 'month/abbreviated',
  MonthWide: 'month/wide',
  MonthNarrow: 'month/narrow',
  MonthAbbreviatedStandalone: 'month/abbreviated/standalone',
  MonthWideStandalone: 'month/wide/standalone',
  MonthNarrowStandalone: 'month/narrow/standalone',

  // Week of year
  WeekOfYearNumeric: 'week-of-year/numeric',
  WeekOfYearTwoDigit: 'week-of-year/2-digit',
  WeekOfYearOrdinal: 'week-of-year/ordinal',
  WeekOfYearNumericIso: 'week-of-year/numeric/iso',
  WeekOfYearTwoDigitIso: 'week-of-year/2-digit/iso',
  WeekOfYearTwoDigitIsoSpacePadded: 'week-of-year/2-digit/iso/space-padded',
  WeekOfYearOrdinalIso: 'week-of-year/ordinal/iso',

  // Day of month
  DayOfMonthNumeric: 'day-of-month/numeric',
  DayOfMonthTwoDigit: 'day-of-month/2-digit',
  DayOfMonthTwoDigitSpacePadded: 'day-of-month/2-digit/space-padded',
  DayOfMonthOrdinal: 'day-of-month/ordinal',

  // Day of year
  DayOfYearNumeric: 'day-of-year/numeric',
  DayOfYearTwoDigit: 'day-of-year/2-digit',
  DayOfYearThreeDigit: 'day-of-year/3-digit',
  DayOfYearThreeDigitSpacePadded: 'day-of-year/3-digit/space-padded',
  DayOfYearOrdinal: 'day-of-year/ordinal',

  // Weekday name
  WeekdayAbbreviated: 'weekday/abbreviated',
  WeekdayWide: 'weekday/wide',
  WeekdayNarrow: 'weekday/narrow',
  WeekdayShort: 'weekday/short',
  WeekdayAbbreviatedStandalone: 'weekday/abbreviated/standalone',
  WeekdayWideStandalone: 'weekday/wide/standalone',
  WeekdayNarrowStandalone: 'weekday/narrow/standalone',
  WeekdayShortStandalone: 'weekday/short/standalone',

  // Weekday as a number
  WeekdayNumeric: 'weekday/numeric',
  WeekdayNumericIso: 'weekday/numeric/iso',

  // Day period — AM/PM
  DayPeriodAbbreviated: 'day-period/abbreviated',
  DayPeriodAbbreviatedLower: 'day-period/abbreviated/lower',
  DayPeriodWide: 'day-period/wide',
  DayPeriodNarrow: 'day-period/narrow',

  // Hour — the `hX` qualifier is the cycle
  // h12 = 1–12, h23 = 0–23, h24 = 1–24, h11 = 0–11
  HourNumericH12: 'hour/numeric/h12',
  HourTwoDigitH12: 'hour/2-digit/h12',
  HourTwoDigitH12SpacePadded: 'hour/2-digit/h12/space-padded',
  HourNumericH23: 'hour/numeric/h23',
  HourTwoDigitH23: 'hour/2-digit/h23',
  HourTwoDigitH23SpacePadded: 'hour/2-digit/h23/space-padded',
  HourNumericH24: 'hour/numeric/h24',
  HourTwoDigitH24: 'hour/2-digit/h24',
  HourNumericH11: 'hour/numeric/h11',
  HourTwoDigitH11: 'hour/2-digit/h11',

  // Minute
  MinuteNumeric: 'minute/numeric',
  MinuteTwoDigit: 'minute/2-digit',
  MinuteTwoDigitSpacePadded: 'minute/2-digit/space-padded',

  // Second
  SecondNumeric: 'second/numeric',
  SecondTwoDigit: 'second/2-digit',
  SecondTwoDigitSpacePadded: 'second/2-digit/space-padded',

  // Fractional second — value carries the number of fraction digits (S, SS, SSS…)
  FractionalSecond1: 'fractional-second/1',
  FractionalSecond2: 'fractional-second/2',
  FractionalSecond3: 'fractional-second/3',

  // Time-zone name
  TimezoneAbbreviated: 'timezone/abbreviated',

  // Time-zone offset, e.g. +05:00 / +0500
  OffsetWithColon: 'offset/with-colon',
  OffsetWithoutColon: 'offset/without-colon',

  // Unix epoch
  EpochSeconds: 'epoch/seconds',
  EpochMilliseconds: 'epoch/milliseconds',

  // Localized presets — deferred to the library's locale at format time, so they
  // are mapped preset ↔ preset (never expanded to a concrete pattern, which would
  // hardcode one locale). Date-only, time-only, and date+time, each short→full.
  LocalizedDateShort: 'localized-date/short',
  LocalizedDateMedium: 'localized-date/medium',
  LocalizedDateLong: 'localized-date/long',
  LocalizedDateFull: 'localized-date/full',

  LocalizedTimeShort: 'localized-time/short',
  LocalizedTimeMedium: 'localized-time/medium',
  LocalizedTimeLong: 'localized-time/long',
  LocalizedTimeFull: 'localized-time/full',

  LocalizedDateTimeShort: 'localized-date-time/short',
  LocalizedDateTimeMedium: 'localized-date-time/medium',
  LocalizedDateTimeLong: 'localized-date-time/long',
  LocalizedDateTimeFull: 'localized-date-time/full',
} as const

/**
 * Union of all stable canonical identifier values in {@link Canonical}.
 *
 * @remarks
 * Use this when defining APIs that accept or return canonical symbols directly,
 * especially `TokenRule.canonical`.
 */
export type CanonicalToken = (typeof Canonical)[keyof typeof Canonical]
