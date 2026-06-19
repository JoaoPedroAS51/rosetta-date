import type { CanonicalToken } from '../src/core/canonical'
import type { DialectName } from '../src/dialects/registry'
import { Canonical } from '../src/core/canonical'

/**
 * Each dialect's primary spelling for every canonical symbol it can express —
 * a hand-written oracle, independent of the dialect tables, so the tests catch
 * a table that drifts from intent.
 *
 * This is the single source the generic suites derive from: dialect↔canonical
 * conformance, the cross-dialect conversion matrix, one-sided (non-bijective)
 * behaviour, and round trips. Adding a dialect to the registry makes TypeScript
 * require its entry here, so coverage of the new dialect is not forgotten.
 */
export const expectations: Record<DialectName, Partial<Record<CanonicalToken, string>>> = {
  moment: {
    [Canonical.EraAbbreviated]: 'N',
    [Canonical.EraWide]: 'NNNN',
    [Canonical.EraNarrow]: 'NNNNN',
    [Canonical.YearNumeric]: 'YYYY',
    [Canonical.YearTwoDigit]: 'YY',
    [Canonical.WeekYearNumeric]: 'gggg',
    [Canonical.WeekYearTwoDigit]: 'gg',
    [Canonical.IsoWeekYearNumeric]: 'GGGG',
    [Canonical.IsoWeekYearTwoDigit]: 'GG',
    [Canonical.QuarterNumeric]: 'Q',
    [Canonical.QuarterOrdinal]: 'Qo',
    [Canonical.MonthNumeric]: 'M',
    [Canonical.MonthTwoDigit]: 'MM',
    [Canonical.MonthOrdinal]: 'Mo',
    [Canonical.MonthAbbreviated]: 'MMM',
    [Canonical.MonthWide]: 'MMMM',
    [Canonical.WeekOfYearNumeric]: 'w',
    [Canonical.WeekOfYearTwoDigit]: 'ww',
    [Canonical.WeekOfYearOrdinal]: 'wo',
    [Canonical.IsoWeekOfYearNumeric]: 'W',
    [Canonical.IsoWeekOfYearTwoDigit]: 'WW',
    [Canonical.IsoWeekOfYearOrdinal]: 'Wo',
    [Canonical.DayOfMonthNumeric]: 'D',
    [Canonical.DayOfMonthTwoDigit]: 'DD',
    [Canonical.DayOfMonthOrdinal]: 'Do',
    [Canonical.DayOfYearNumeric]: 'DDD',
    [Canonical.DayOfYearThreeDigit]: 'DDDD',
    [Canonical.DayOfYearOrdinal]: 'DDDo',
    [Canonical.WeekdayAbbreviated]: 'ddd',
    [Canonical.WeekdayWide]: 'dddd',
    [Canonical.WeekdayShort]: 'dd',
    [Canonical.WeekdayNumeric]: 'd',
    [Canonical.IsoWeekdayNumeric]: 'E',
    [Canonical.DayPeriodAbbreviated]: 'A',
    [Canonical.Hour12Numeric]: 'h',
    [Canonical.Hour12TwoDigit]: 'hh',
    [Canonical.Hour24Numeric]: 'H',
    [Canonical.Hour24TwoDigit]: 'HH',
    [Canonical.Hour24From1Numeric]: 'k',
    [Canonical.Hour24From1TwoDigit]: 'kk',
    [Canonical.MinuteNumeric]: 'm',
    [Canonical.MinuteTwoDigit]: 'mm',
    [Canonical.SecondNumeric]: 's',
    [Canonical.SecondTwoDigit]: 'ss',
    [Canonical.FractionalSecond1]: 'S',
    [Canonical.FractionalSecond2]: 'SS',
    [Canonical.FractionalSecond3]: 'SSS',
    [Canonical.TimezoneAbbreviated]: 'z',
    [Canonical.OffsetWithColon]: 'Z',
    [Canonical.OffsetWithoutColon]: 'ZZ',
    [Canonical.EpochSeconds]: 'X',
    [Canonical.EpochMilliseconds]: 'x',
    [Canonical.LocalizedDateShort]: 'L',
    [Canonical.LocalizedDateMedium]: 'll',
    [Canonical.LocalizedDateLong]: 'LL',
    [Canonical.LocalizedTimeShort]: 'LT',
    [Canonical.LocalizedTimeMedium]: 'LTS',
    [Canonical.LocalizedDateTimeMedium]: 'lll',
    [Canonical.LocalizedDateTimeLong]: 'LLL',
    [Canonical.LocalizedDateTimeFull]: 'LLLL',
  },
  ldml: {
    [Canonical.EraAbbreviated]: 'GGG',
    [Canonical.EraWide]: 'GGGG',
    [Canonical.EraNarrow]: 'GGGGG',
    [Canonical.YearNumeric]: 'yyyy',
    [Canonical.YearTwoDigit]: 'yy',
    [Canonical.WeekYearNumeric]: 'YYYY',
    [Canonical.WeekYearTwoDigit]: 'YY',
    [Canonical.QuarterNumeric]: 'Q',
    [Canonical.MonthNumeric]: 'M',
    [Canonical.MonthTwoDigit]: 'MM',
    [Canonical.MonthAbbreviated]: 'MMM',
    [Canonical.MonthWide]: 'MMMM',
    [Canonical.MonthNarrow]: 'MMMMM',
    [Canonical.WeekOfYearNumeric]: 'w',
    [Canonical.WeekOfYearTwoDigit]: 'ww',
    [Canonical.DayOfMonthNumeric]: 'd',
    [Canonical.DayOfMonthTwoDigit]: 'dd',
    [Canonical.DayOfYearNumeric]: 'D',
    [Canonical.DayOfYearTwoDigit]: 'DD',
    [Canonical.DayOfYearThreeDigit]: 'DDD',
    [Canonical.WeekdayAbbreviated]: 'EEE',
    [Canonical.WeekdayWide]: 'EEEE',
    [Canonical.WeekdayNarrow]: 'EEEEE',
    [Canonical.WeekdayShort]: 'EEEEEE',
    [Canonical.WeekdayNumeric]: 'e',
    [Canonical.DayPeriodAbbreviated]: 'a',
    [Canonical.DayPeriodWide]: 'aaaa',
    [Canonical.DayPeriodNarrow]: 'aaaaa',
    [Canonical.Hour12Numeric]: 'h',
    [Canonical.Hour12TwoDigit]: 'hh',
    [Canonical.Hour24Numeric]: 'H',
    [Canonical.Hour24TwoDigit]: 'HH',
    [Canonical.Hour24From1Numeric]: 'k',
    [Canonical.Hour24From1TwoDigit]: 'kk',
    [Canonical.Hour11Numeric]: 'K',
    [Canonical.Hour11TwoDigit]: 'KK',
    [Canonical.MinuteNumeric]: 'm',
    [Canonical.MinuteTwoDigit]: 'mm',
    [Canonical.SecondNumeric]: 's',
    [Canonical.SecondTwoDigit]: 'ss',
    [Canonical.FractionalSecond1]: 'S',
    [Canonical.FractionalSecond2]: 'SS',
    [Canonical.FractionalSecond3]: 'SSS',
    [Canonical.TimezoneAbbreviated]: 'zzz',
    [Canonical.OffsetWithColon]: 'xxx',
    [Canonical.OffsetWithoutColon]: 'xx',
  },
}

/**
 * Extra (non-primary) spellings a dialect accepts when parsing. They normalize
 * to the primary token on render, so they are only checked for parse mapping.
 */
export const aliases: Partial<Record<DialectName, ReadonlyArray<readonly [token: string, canonical: CanonicalToken]>>> = {
  moment: [
    ['Y', Canonical.YearNumeric],
    ['a', Canonical.DayPeriodAbbreviated],
    ['zz', Canonical.TimezoneAbbreviated],
  ],
  ldml: [
    ['y', Canonical.YearNumeric],
    ['yyy', Canonical.YearNumeric],
    ['G', Canonical.EraAbbreviated],
    ['GG', Canonical.EraAbbreviated],
    ['E', Canonical.WeekdayAbbreviated],
    ['EE', Canonical.WeekdayAbbreviated],
    ['aa', Canonical.DayPeriodAbbreviated],
    ['aaa', Canonical.DayPeriodAbbreviated],
    ['z', Canonical.TimezoneAbbreviated],
    ['zz', Canonical.TimezoneAbbreviated],
  ],
}

/**
 * Real-world composite formats, per source dialect, exercised through full
 * round trips (source → other → source).
 */
export const composites: Partial<Record<DialectName, readonly string[]>> = {
  moment: [
    'DD/MM/YYYY',
    'YYYY-MM-DD[T]HH:mm:ss',
    'ddd, DD MMM YYYY',
    'h:mm A',
    'dddd, MMMM DD YYYY',
    'DD [of] MMMM, YYYY',
  ],
  ldml: [
    'dd/MM/yyyy',
    'yyyy-MM-dd\'T\'HH:mm:ss',
    'EEE, dd MMM yyyy',
    'h:mm a',
  ],
}
