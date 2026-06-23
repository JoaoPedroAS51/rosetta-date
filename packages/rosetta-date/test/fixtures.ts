import type { CanonicalToken } from '../src/core/canonical'
import type { Dialect } from '../src/core/types'
import type { DialectName } from '../src/dialects/registry'
import type { LibraryName } from '../src/libraries/registry'
import { Canonical } from '../src/core/canonical'
import { dialects } from '../src/dialects/registry'
import { libraries } from '../src/libraries/registry'

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
    [Canonical.WeekYearNumericIso]: 'GGGG',
    [Canonical.WeekYearTwoDigitIso]: 'GG',
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
    [Canonical.WeekOfYearNumericIso]: 'W',
    [Canonical.WeekOfYearTwoDigitIso]: 'WW',
    [Canonical.WeekOfYearOrdinalIso]: 'Wo',
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
    [Canonical.WeekdayNumericIso]: 'E',
    [Canonical.DayPeriodAbbreviated]: 'A',
    [Canonical.DayPeriodAbbreviatedLower]: 'a',
    [Canonical.HourNumericH12]: 'h',
    [Canonical.HourTwoDigitH12]: 'hh',
    [Canonical.HourNumericH23]: 'H',
    [Canonical.HourTwoDigitH23]: 'HH',
    [Canonical.HourNumericH24]: 'k',
    [Canonical.HourTwoDigitH24]: 'kk',
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
    [Canonical.QuarterTwoDigit]: 'QQ',
    [Canonical.QuarterAbbreviated]: 'QQQ',
    [Canonical.QuarterWide]: 'QQQQ',
    [Canonical.QuarterNarrow]: 'QQQQQ',
    [Canonical.QuarterAbbreviatedStandalone]: 'qqq',
    [Canonical.QuarterWideStandalone]: 'qqqq',
    [Canonical.QuarterNarrowStandalone]: 'qqqqq',
    [Canonical.MonthNumeric]: 'M',
    [Canonical.MonthTwoDigit]: 'MM',
    [Canonical.MonthAbbreviated]: 'MMM',
    [Canonical.MonthWide]: 'MMMM',
    [Canonical.MonthNarrow]: 'MMMMM',
    [Canonical.MonthAbbreviatedStandalone]: 'LLL',
    [Canonical.MonthWideStandalone]: 'LLLL',
    [Canonical.MonthNarrowStandalone]: 'LLLLL',
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
    [Canonical.WeekdayAbbreviatedStandalone]: 'ccc',
    [Canonical.WeekdayWideStandalone]: 'cccc',
    [Canonical.WeekdayNarrowStandalone]: 'ccccc',
    [Canonical.WeekdayShortStandalone]: 'cccccc',
    [Canonical.WeekdayNumeric]: 'e',
    [Canonical.DayPeriodAbbreviated]: 'a',
    [Canonical.DayPeriodWide]: 'aaaa',
    [Canonical.DayPeriodNarrow]: 'aaaaa',
    [Canonical.HourNumericH12]: 'h',
    [Canonical.HourTwoDigitH12]: 'hh',
    [Canonical.HourNumericH23]: 'H',
    [Canonical.HourTwoDigitH23]: 'HH',
    [Canonical.HourNumericH24]: 'k',
    [Canonical.HourTwoDigitH24]: 'kk',
    [Canonical.HourNumericH11]: 'K',
    [Canonical.HourTwoDigitH11]: 'KK',
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
  strftime: {
    [Canonical.YearNumeric]: '%Y',
    [Canonical.YearTwoDigit]: '%y',
    [Canonical.CenturyTwoDigit]: '%C',
    [Canonical.WeekYearNumericIso]: '%G',
    [Canonical.WeekYearTwoDigitIso]: '%g',
    [Canonical.MonthTwoDigit]: '%m',
    [Canonical.MonthNumeric]: '%-m',
    [Canonical.MonthAbbreviated]: '%b',
    [Canonical.MonthWide]: '%B',
    [Canonical.DayOfMonthTwoDigit]: '%d',
    [Canonical.DayOfMonthNumeric]: '%-d',
    [Canonical.DayOfMonthSpacePadded]: '%e',
    [Canonical.DayOfYearThreeDigit]: '%j',
    [Canonical.DayOfYearNumeric]: '%-j',
    [Canonical.WeekOfYearTwoDigitIso]: '%V',
    [Canonical.WeekOfYearNumericIso]: '%-V',
    [Canonical.WeekdayNumeric]: '%w',
    [Canonical.WeekdayNumericIso]: '%u',
    [Canonical.WeekdayAbbreviated]: '%a',
    [Canonical.WeekdayWide]: '%A',
    [Canonical.DayPeriodAbbreviated]: '%p',
    [Canonical.DayPeriodAbbreviatedLower]: '%P',
    [Canonical.HourTwoDigitH12]: '%I',
    [Canonical.HourNumericH12]: '%-I',
    [Canonical.HourSpacePaddedH12]: '%l',
    [Canonical.HourTwoDigitH23]: '%H',
    [Canonical.HourNumericH23]: '%-H',
    [Canonical.HourSpacePaddedH23]: '%k',
    [Canonical.MinuteTwoDigit]: '%M',
    [Canonical.MinuteNumeric]: '%-M',
    [Canonical.SecondTwoDigit]: '%S',
    [Canonical.SecondNumeric]: '%-S',
    [Canonical.TimezoneAbbreviated]: '%Z',
    [Canonical.OffsetWithoutColon]: '%z',
    [Canonical.EpochSeconds]: '%s',
    [Canonical.LocalizedDateShort]: '%x',
    [Canonical.LocalizedTimeMedium]: '%X',
    [Canonical.LocalizedDateTimeFull]: '%c',
  },
}

/**
 * Extra (non-primary) spellings an endpoint accepts when parsing — including a
 * library's `extends` aliases. They normalize to the primary token on render, so
 * they are only checked for parse mapping (through the endpoint's grammar).
 */
export const aliases: Partial<Record<EndpointName, ReadonlyArray<readonly [token: string, canonical: CanonicalToken]>>> = {
  'moment': [
    ['Y', Canonical.YearNumeric],
    ['zz', Canonical.TimezoneAbbreviated],
  ],
  'ldml': [
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
  'date-fns': [
    // `R` is date-fns's non-primary spelling of the ISO week-year (primary `RRRR`).
    ['R', Canonical.WeekYearNumericIso],
  ],
  'strftime': [
    // `%h` is a non-primary spelling of the abbreviated month (primary `%b`).
    ['%h', Canonical.MonthAbbreviated],
    // `%0X` is the glibc explicit-zero flag: a redundant spelling of the default
    // zero-padded directive, so it parses but normalizes to `%X` on render.
    ['%0d', Canonical.DayOfMonthTwoDigit],
    ['%0m', Canonical.MonthTwoDigit],
    ['%0y', Canonical.YearTwoDigit],
    ['%0H', Canonical.HourTwoDigitH23],
    ['%0I', Canonical.HourTwoDigitH12],
    ['%0M', Canonical.MinuteTwoDigit],
    ['%0S', Canonical.SecondTwoDigit],
    ['%0j', Canonical.DayOfYearThreeDigit],
    ['%0V', Canonical.WeekOfYearTwoDigitIso],
    ['%0g', Canonical.WeekYearTwoDigitIso],
    ['%0C', Canonical.CenturyTwoDigit],
  ],
}

/**
 * Real-world composite formats per dialect, round-tripped across the literal-style
 * boundary (dialect → other → dialect). Composites exercise literal escaping and
 * token adjacency — a dialect-level concern — so they are keyed by dialect, not
 * endpoint: a library inherits its dialect's literal rules and adds nothing here
 * (extension-token adjacency lives in the preset tests in `libraries.test.ts`).
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
  strftime: [
    '%Y-%m-%d',
    '%d/%m/%Y %H:%M:%S',
    '%Y%m%d',
    '%a, %d %b %Y',
    '%Y %%done%%',
  ],
}

/**
 * Every conversion endpoint — dialects and libraries — keyed by name. The generic
 * suites iterate this, so adding either kind earns conformance, matrix, round-trip,
 * and totality coverage with no new test code: TypeScript requires an `expectations`
 * entry for a new dialect and a `libraryDeltas` entry for a new library, since
 * `test/` is type-checked.
 */
export const endpoints = { ...dialects, ...libraries }
export type EndpointName = keyof typeof endpoints

/**
 * Per-library delta over its base dialect's oracle, authored **independently** of
 * the library's own `supports`/`extends` so the two cross-check: `excludes` are the
 * base fields the library does NOT render — the opposite polarity of the library's
 * positive `supports`, which is what makes the check non-circular — and `extends`
 * are the fields it adds on top, each with the spelling it renders them as.
 */
export const libraryDeltas: Record<LibraryName, {
  readonly base: DialectName
  readonly excludes?: readonly CanonicalToken[]
  readonly extends?: Partial<Record<CanonicalToken, string>>
}> = {
  'momentjs': { base: 'moment' },
  'dayjs': {
    base: 'moment',
    excludes: [
      Canonical.EraAbbreviated,
      Canonical.EraWide,
      Canonical.EraNarrow,
      Canonical.WeekYearTwoDigit,
      Canonical.WeekYearTwoDigitIso,
      Canonical.QuarterOrdinal,
      Canonical.MonthOrdinal,
      Canonical.WeekOfYearOrdinalIso,
      Canonical.DayOfYearNumeric,
      Canonical.DayOfYearThreeDigit,
      Canonical.DayOfYearOrdinal,
      Canonical.WeekdayNumericIso,
      Canonical.FractionalSecond1,
      Canonical.FractionalSecond2,
    ],
  },
  'date-fns': {
    base: 'ldml',
    extends: {
      [Canonical.QuarterOrdinal]: 'Qo',
      [Canonical.MonthOrdinal]: 'Mo',
      [Canonical.WeekOfYearOrdinal]: 'wo',
      [Canonical.DayOfMonthOrdinal]: 'do',
      [Canonical.DayOfYearOrdinal]: 'Do',
      [Canonical.WeekOfYearOrdinalIso]: 'Io',
      [Canonical.WeekYearNumericIso]: 'RRRR',
      [Canonical.WeekYearTwoDigitIso]: 'RR',
      [Canonical.WeekOfYearNumericIso]: 'I',
      [Canonical.WeekOfYearTwoDigitIso]: 'II',
      [Canonical.WeekdayNumericIso]: 'i',
      [Canonical.EpochSeconds]: 't',
      [Canonical.EpochMilliseconds]: 'T',
      [Canonical.LocalizedDateShort]: 'P',
      [Canonical.LocalizedDateMedium]: 'PP',
      [Canonical.LocalizedDateLong]: 'PPP',
      [Canonical.LocalizedDateFull]: 'PPPP',
      [Canonical.LocalizedTimeShort]: 'p',
      [Canonical.LocalizedTimeMedium]: 'pp',
      [Canonical.LocalizedTimeLong]: 'ppp',
      [Canonical.LocalizedTimeFull]: 'pppp',
      [Canonical.LocalizedDateTimeShort]: 'Pp',
      [Canonical.LocalizedDateTimeMedium]: 'PPpp',
      [Canonical.LocalizedDateTimeLong]: 'PPPppp',
      [Canonical.LocalizedDateTimeFull]: 'PPPPpppp',
    },
  },
}

/**
 * The canonical → primary-spelling map an endpoint renders: a dialect's oracle as
 * written, or a library's base oracle transformed by its delta (drop `excludes`,
 * add `extends`). The keys are exactly the fields the endpoint renders.
 */
export function renderOracle(name: EndpointName): Partial<Record<CanonicalToken, string>> {
  if (!(name in libraryDeltas))
    return expectations[name as DialectName]
  const delta = libraryDeltas[name as LibraryName]
  const oracle = { ...expectations[delta.base] }
  for (const canonical of delta.excludes ?? [])
    delete oracle[canonical]
  return { ...oracle, ...delta.extends }
}

/** The grammar an endpoint parses through — a library resolves to its effective dialect. */
export function grammarOf(name: EndpointName): Dialect {
  const endpoint = endpoints[name]
  return 'resolved' in endpoint ? endpoint.resolved.dialect : endpoint
}
