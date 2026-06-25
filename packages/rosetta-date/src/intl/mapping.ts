import type { CanonicalToken } from '../core/canonical'
import { Canonical } from '../core/canonical'
import { decodeCanonical } from '../core/decode'

type Options = Intl.DateTimeFormatOptions
type HourCycle = 'h11' | 'h12' | 'h23' | 'h24'
type Numeric = 'numeric' | '2-digit'
type Style = 'full' | 'long' | 'medium' | 'short'

/**
 * Forward tables, canonical `field/style` to its Intl contribution.
 *
 * @remarks
 * Each table is keyed by the canonical *style* and stores the full options
 * fragment, so the mapping is plain data with no per-field branching. CLDR name
 * widths fold in here (`wide` maps to `long`, `abbreviated` maps to `short`,
 * `narrow` stays `narrow`), as does the `field/style/cycle` to `hour` +
 * `hourCycle` split. A style with no `Intl` equivalent, such as `ordinal`, is
 * absent.
 */
const ERA: Record<string, Options> = {
  wide: { era: 'long' },
  abbreviated: { era: 'short' },
  narrow: { era: 'narrow' },
}
const YEAR: Record<string, Options> = {
  'numeric': { year: 'numeric' },
  '2-digit': { year: '2-digit' },
}
const MONTH: Record<string, Options> = {
  'numeric': { month: 'numeric' },
  '2-digit': { month: '2-digit' },
  'abbreviated': { month: 'short' },
  'wide': { month: 'long' },
  'narrow': { month: 'narrow' },
}
const DAY: Record<string, Options> = {
  'numeric': { day: 'numeric' },
  '2-digit': { day: '2-digit' },
}
const WEEKDAY: Record<string, Options> = {
  abbreviated: { weekday: 'short' },
  wide: { weekday: 'long' },
  narrow: { weekday: 'narrow' },
}
const MINUTE: Record<string, Options> = {
  'numeric': { minute: 'numeric' },
  '2-digit': { minute: '2-digit' },
}
const SECOND: Record<string, Options> = {
  'numeric': { second: 'numeric' },
  '2-digit': { second: '2-digit' },
}
const FRACTION: Record<string, Options> = {
  1: { fractionalSecondDigits: 1 },
  2: { fractionalSecondDigits: 2 },
  3: { fractionalSecondDigits: 3 },
}
// The `z` family maps to the closest Intl equivalent: the short zone name.
const TIMEZONE: Record<string, Options> = {
  abbreviated: { timeZoneName: 'short' },
}
// Approximate: Intl renders a `GMT`-prefixed offset, not a bare `+05:00`.
const OFFSET: Record<string, Options> = {
  'with-colon': { timeZoneName: 'longOffset' },
  'without-colon': { timeZoneName: 'shortOffset' },
}
const HOUR: Record<string, Options> = {
  'numeric/h11': { hour: 'numeric', hourCycle: 'h11' },
  'numeric/h12': { hour: 'numeric', hourCycle: 'h12' },
  'numeric/h23': { hour: 'numeric', hourCycle: 'h23' },
  'numeric/h24': { hour: 'numeric', hourCycle: 'h24' },
  '2-digit/h11': { hour: '2-digit', hourCycle: 'h11' },
  '2-digit/h12': { hour: '2-digit', hourCycle: 'h12' },
  '2-digit/h23': { hour: '2-digit', hourCycle: 'h23' },
  '2-digit/h24': { hour: '2-digit', hourCycle: 'h24' },
}
const DATE_STYLE: Record<string, Options> = {
  short: { dateStyle: 'short' },
  medium: { dateStyle: 'medium' },
  long: { dateStyle: 'long' },
  full: { dateStyle: 'full' },
}
const TIME_STYLE: Record<string, Options> = {
  short: { timeStyle: 'short' },
  medium: { timeStyle: 'medium' },
  long: { timeStyle: 'long' },
  full: { timeStyle: 'full' },
}
const DATE_TIME_STYLE: Record<string, Options> = {
  short: { dateStyle: 'short', timeStyle: 'short' },
  medium: { dateStyle: 'medium', timeStyle: 'medium' },
  long: { dateStyle: 'long', timeStyle: 'long' },
  full: { dateStyle: 'full', timeStyle: 'full' },
}

/** Re-join a canonical `style` with its `qualifiers` into a single table key. */
function styleKey(style: string, qualifiers: readonly string[]): string {
  return [style, ...qualifiers].join('/')
}

const FORWARD: Record<string, (style: string, qualifiers: readonly string[]) => Options | undefined> = {
  'era': style => ERA[style],
  'year': style => YEAR[style],
  'month': style => MONTH[style],
  'day-of-month': style => DAY[style],
  'weekday': style => WEEKDAY[style],
  'hour': (style, qualifiers) => HOUR[styleKey(style, qualifiers)],
  'minute': style => MINUTE[style],
  'second': style => SECOND[style],
  'fractional-second': style => FRACTION[style],
  'timezone': style => TIMEZONE[style],
  'offset': style => OFFSET[style],
  'localized-date': style => DATE_STYLE[style],
  'localized-time': style => TIME_STYLE[style],
  'localized-date-time': style => DATE_TIME_STYLE[style],
}

/**
 * Map one canonical field to its contribution to an `Intl` options object, or
 * `undefined` when `Intl` has no equivalent.
 *
 * @remarks
 * `Intl` cannot express the standalone-vs-formatting distinction, nor can it
 * force a fill character, so the `standalone` and `space-padded` qualifiers are
 * unsupported. Other unsupported examples include quarter, week-year,
 * week-of-year, day-of-year, ordinals, ISO week fields, epoch, day period
 * markers, and numeric or short weekday forms.
 *
 * @internal
 */
export function canonicalToIntl(token: CanonicalToken): Options | undefined {
  const { field, style, qualifiers } = decodeCanonical(token)
  if (qualifiers.includes('standalone') || qualifiers.includes('space-padded'))
    return undefined
  return FORWARD[field]?.(style, qualifiers)
}

/** Inverse tables, Intl value to canonical symbol. */
const ERA_REVERSE: Record<string, CanonicalToken> = {
  long: Canonical.EraWide,
  short: Canonical.EraAbbreviated,
  narrow: Canonical.EraNarrow,
}
const YEAR_REVERSE: Record<string, CanonicalToken> = {
  'numeric': Canonical.YearNumeric,
  '2-digit': Canonical.YearTwoDigit,
}
const MONTH_REVERSE: Record<string, CanonicalToken> = {
  'numeric': Canonical.MonthNumeric,
  '2-digit': Canonical.MonthTwoDigit,
  'long': Canonical.MonthWide,
  'short': Canonical.MonthAbbreviated,
  'narrow': Canonical.MonthNarrow,
}
const DAY_REVERSE: Record<string, CanonicalToken> = {
  'numeric': Canonical.DayOfMonthNumeric,
  '2-digit': Canonical.DayOfMonthTwoDigit,
}
const WEEKDAY_REVERSE: Record<string, CanonicalToken> = {
  long: Canonical.WeekdayWide,
  short: Canonical.WeekdayAbbreviated,
  narrow: Canonical.WeekdayNarrow,
}
const MINUTE_REVERSE: Record<string, CanonicalToken> = {
  'numeric': Canonical.MinuteNumeric,
  '2-digit': Canonical.MinuteTwoDigit,
}
const SECOND_REVERSE: Record<string, CanonicalToken> = {
  'numeric': Canonical.SecondNumeric,
  '2-digit': Canonical.SecondTwoDigit,
}
const FRACTION_REVERSE: Record<string, CanonicalToken> = {
  1: Canonical.FractionalSecond1,
  2: Canonical.FractionalSecond2,
  3: Canonical.FractionalSecond3,
}
const TIME_ZONE_NAME_REVERSE: Record<string, CanonicalToken> = {
  short: Canonical.TimezoneAbbreviated,
  longOffset: Canonical.OffsetWithColon,
  shortOffset: Canonical.OffsetWithoutColon,
}
const HOUR_REVERSE: Record<Numeric, Record<HourCycle, CanonicalToken>> = {
  'numeric': {
    h11: Canonical.HourNumericH11,
    h12: Canonical.HourNumericH12,
    h23: Canonical.HourNumericH23,
    h24: Canonical.HourNumericH24,
  },
  '2-digit': {
    h11: Canonical.HourTwoDigitH11,
    h12: Canonical.HourTwoDigitH12,
    h23: Canonical.HourTwoDigitH23,
    h24: Canonical.HourTwoDigitH24,
  },
}

const DATE_PRESET: Record<Style, CanonicalToken> = {
  full: Canonical.LocalizedDateFull,
  long: Canonical.LocalizedDateLong,
  medium: Canonical.LocalizedDateMedium,
  short: Canonical.LocalizedDateShort,
}
const TIME_PRESET: Record<Style, CanonicalToken> = {
  full: Canonical.LocalizedTimeFull,
  long: Canonical.LocalizedTimeLong,
  medium: Canonical.LocalizedTimeMedium,
  short: Canonical.LocalizedTimeShort,
}
const DATE_TIME_PRESET: Record<Style, CanonicalToken> = {
  full: Canonical.LocalizedDateTimeFull,
  long: Canonical.LocalizedDateTimeLong,
  medium: Canonical.LocalizedDateTimeMedium,
  short: Canonical.LocalizedDateTimeShort,
}

/**
 * The hour cycle Intl would otherwise resolve from the locale. Absent a locale,
 * default to `h23` (24-hour). This is deterministic and common worldwide.
 */
function hourCycleOf(options: Options): HourCycle {
  return options.hourCycle ?? (options.hour12 === true ? 'h12' : 'h23')
}

/**
 * Map an Intl options object to canonical symbols in CLDR canonical field order.
 *
 * @remarks
 * Style options (`dateStyle`/`timeStyle`) take the preset path. Intl forbids
 * mixing styles with component options, so the two are disjoint. A `dateStyle`
 * and `timeStyle` at different levels has no single locale-correct fused preset,
 * so it is reported unrepresentable.
 *
 * Component options follow CLDR canonical order, from era through zone. `Intl`
 * options are an unordered bag, so the result is a skeleton, not a localized
 * layout.
 *
 * @returns The mapped canonicals in order, and any Intl keys with no canonical.
 *
 * @internal
 */
export function intlToCanonical(options: Options): { tokens: CanonicalToken[], unsupported: string[] } {
  const tokens: CanonicalToken[] = []
  const unsupported: string[] = []

  // The style axis takes the preset path. Intl forbids mixing `dateStyle` /
  // `timeStyle` with component options, so when a style is set the component
  // lookups below all miss — no early return needed to keep them disjoint.
  const date = options.dateStyle
  const time = options.timeStyle
  if (date !== undefined && time !== undefined) {
    if (date === time)
      tokens.push(DATE_TIME_PRESET[date])
    else
      unsupported.push(`dateStyle:${date}+timeStyle:${time}`)
  }
  else if (date !== undefined) {
    tokens.push(DATE_PRESET[date])
  }
  else if (time !== undefined) {
    tokens.push(TIME_PRESET[time])
  }

  const map = (table: Record<string, CanonicalToken>, value: string | undefined, key: string): void => {
    if (value === undefined)
      return
    const canonical = table[value]
    if (canonical !== undefined)
      tokens.push(canonical)
    else
      unsupported.push(`${key}:${value}`)
  }

  map(ERA_REVERSE, options.era, 'era')
  map(YEAR_REVERSE, options.year, 'year')
  map(MONTH_REVERSE, options.month, 'month')
  map(DAY_REVERSE, options.day, 'day')
  map(WEEKDAY_REVERSE, options.weekday, 'weekday')
  if (options.dayPeriod !== undefined)
    unsupported.push(`dayPeriod:${options.dayPeriod}`)
  if (options.hour !== undefined)
    tokens.push(HOUR_REVERSE[options.hour][hourCycleOf(options)])
  map(MINUTE_REVERSE, options.minute, 'minute')
  map(SECOND_REVERSE, options.second, 'second')
  if (options.fractionalSecondDigits !== undefined)
    map(FRACTION_REVERSE, String(options.fractionalSecondDigits), 'fractionalSecondDigits')
  map(TIME_ZONE_NAME_REVERSE, options.timeZoneName, 'timeZoneName')

  return { tokens, unsupported }
}
