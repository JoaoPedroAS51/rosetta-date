/**
 * The neutral canonical vocabulary — the "hub" every dialect maps to and from.
 *
 * Each entry names a date-field *semantic* together with its *style* (width /
 * representation), independent of any single library or dialect. A dialect token
 * such as `YYYY` (moment) or `yyyy` (ldml) is just one spelling of the same
 * canonical symbol ({@link Canonical.YearNumeric}). Conversion therefore never
 * compares tokens directly: it routes everything through these symbols, which is
 * what keeps directions consistent and prevents lib-vs-dialect confusion (e.g.
 * moment `DD` = day-of-month, *not* the LDML `DD` = day-of-year).
 *
 * The string values are stable identifiers shaped as `field/style`. They are an
 * internal contract: dialect tables reference them, and tests/doc tooling can
 * iterate over them — but they are not part of the public API.
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

  // Hour, 1–24 (moment `k`)
  Hour24From1Numeric: 'hour-24-from-1/numeric',
  Hour24From1TwoDigit: 'hour-24-from-1/2-digit',

  // Hour, 0–11 (moment has no token; reserved for dialects that do)
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
 * A canonical symbol — one of the stable identifiers in {@link Canonical}.
 *
 * This is the currency the conversion engine speaks: a parser turns dialect
 * tokens into these, and a renderer turns these back into another dialect's
 * tokens.
 */
export type CanonicalToken = (typeof Canonical)[keyof typeof Canonical]
