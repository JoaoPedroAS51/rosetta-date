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
 * Stability: values are stable `field/style` identifiers. Adding a member is a
 * minor, additive change. Renaming or removing a member is breaking.
 */
export const Canonical = {
  // Era — e.g. AD / Anno Domini
  EraAbbreviated: 'era/abbreviated',
  EraWide: 'era/wide',
  EraNarrow: 'era/narrow',

  // Calendar year
  YearNumeric: 'year/numeric',
  YearTwoDigit: 'year/2-digit',

  // Week-numbering year (the year that owns a given ISO/locale week)
  WeekYearNumeric: 'week-year/numeric',
  WeekYearTwoDigit: 'week-year/2-digit',
  IsoWeekYearNumeric: 'iso-week-year/numeric',
  IsoWeekYearTwoDigit: 'iso-week-year/2-digit',

  // Quarter
  QuarterNumeric: 'quarter/numeric',
  QuarterOrdinal: 'quarter/ordinal',

  // Month
  MonthNumeric: 'month/numeric',
  MonthTwoDigit: 'month/2-digit',
  MonthOrdinal: 'month/ordinal',
  MonthAbbreviated: 'month/abbreviated',
  MonthWide: 'month/wide',
  MonthNarrow: 'month/narrow',

  // Week of year
  WeekOfYearNumeric: 'week-of-year/numeric',
  WeekOfYearTwoDigit: 'week-of-year/2-digit',
  WeekOfYearOrdinal: 'week-of-year/ordinal',
  IsoWeekOfYearNumeric: 'iso-week-of-year/numeric',
  IsoWeekOfYearTwoDigit: 'iso-week-of-year/2-digit',
  IsoWeekOfYearOrdinal: 'iso-week-of-year/ordinal',

  // Day of month
  DayOfMonthNumeric: 'day-of-month/numeric',
  DayOfMonthTwoDigit: 'day-of-month/2-digit',
  DayOfMonthOrdinal: 'day-of-month/ordinal',

  // Day of year
  DayOfYearNumeric: 'day-of-year/numeric',
  DayOfYearTwoDigit: 'day-of-year/2-digit',
  DayOfYearThreeDigit: 'day-of-year/3-digit',
  DayOfYearOrdinal: 'day-of-year/ordinal',

  // Weekday name
  WeekdayAbbreviated: 'weekday/abbreviated',
  WeekdayWide: 'weekday/wide',
  WeekdayNarrow: 'weekday/narrow',
  WeekdayShort: 'weekday/short',

  // Weekday as a number
  WeekdayNumeric: 'weekday/numeric',
  IsoWeekdayNumeric: 'iso-weekday/numeric',

  // Day period — AM/PM
  DayPeriodAbbreviated: 'day-period/abbreviated',
  DayPeriodWide: 'day-period/wide',
  DayPeriodNarrow: 'day-period/narrow',

  // Hour, 1–12
  Hour12Numeric: 'hour-12/numeric',
  Hour12TwoDigit: 'hour-12/2-digit',

  // Hour, 0–23
  Hour24Numeric: 'hour-24/numeric',
  Hour24TwoDigit: 'hour-24/2-digit',

  // Hour, 1–24
  Hour24From1Numeric: 'hour-24-from-1/numeric',
  Hour24From1TwoDigit: 'hour-24-from-1/2-digit',

  // Hour, 0–11
  Hour11Numeric: 'hour-11/numeric',
  Hour11TwoDigit: 'hour-11/2-digit',

  // Minute
  MinuteNumeric: 'minute/numeric',
  MinuteTwoDigit: 'minute/2-digit',

  // Second
  SecondNumeric: 'second/numeric',
  SecondTwoDigit: 'second/2-digit',

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
