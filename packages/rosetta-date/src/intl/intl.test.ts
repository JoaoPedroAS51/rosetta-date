import { describe, expect, it } from 'vitest'
import { Canonical } from '../core/canonical'
import { decodeCanonical } from '../core/decode'
import { ldml } from '../dialects/ldml'
import { moment } from '../dialects/moment'
import { dateFns } from '../libraries/date-fns'
import { dayjs } from '../libraries/dayjs'
import { momentjs } from '../libraries/momentjs'
import { fromIntlOptions, toIntlOptions } from './index'
import { canonicalToIntl, intlToCanonical } from './mapping'

describe('decodeCanonical', () => {
  it('splits field, style, and trailing qualifiers on `/`', () => {
    expect(decodeCanonical(Canonical.HourTwoDigitH23)).toEqual({ field: 'hour', style: '2-digit', qualifiers: ['h23'] })
    expect(decodeCanonical(Canonical.MinuteNumeric)).toEqual({ field: 'minute', style: 'numeric', qualifiers: [] })
    expect(decodeCanonical(Canonical.WeekOfYearOrdinalIso)).toEqual({ field: 'week-of-year', style: 'ordinal', qualifiers: ['iso'] })
    expect(decodeCanonical(Canonical.MonthWideStandalone)).toEqual({ field: 'month', style: 'wide', qualifiers: ['standalone'] })
  })

  it('keeps internal hyphens in the field segment', () => {
    expect(decodeCanonical(Canonical.DayOfMonthNumeric).field).toBe('day-of-month')
    expect(decodeCanonical(Canonical.LocalizedDateTimeFull).field).toBe('localized-date-time')
  })
})

describe('toIntlOptions', () => {
  it('reads components into an options bag, splitting the hour cycle', () => {
    expect(toIntlOptions('YYYY-MM-DD HH:mm', { from: moment })).toEqual({
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  })

  it('maps each hour cycle through its qualifier', () => {
    expect(toIntlOptions('h', { from: moment })).toEqual({ hour: 'numeric', hourCycle: 'h12' })
    expect(toIntlOptions('k', { from: moment })).toEqual({ hour: 'numeric', hourCycle: 'h24' })
    expect(toIntlOptions('HH', { from: moment })).toEqual({ hour: '2-digit', hourCycle: 'h23' })
  })

  it('maps CLDR name widths to Intl long/short/narrow', () => {
    expect(toIntlOptions('MMMM', { from: moment })).toEqual({ month: 'long' })
    expect(toIntlOptions('MMM', { from: moment })).toEqual({ month: 'short' })
    expect(toIntlOptions('MMMMM', { from: ldml })).toEqual({ month: 'narrow' })
    expect(toIntlOptions('GGGG', { from: ldml })).toEqual({ era: 'long' })
  })

  it('covers the remaining mappable components', () => {
    expect(toIntlOptions('ss', { from: moment })).toEqual({ second: '2-digit' })
    expect(toIntlOptions('dddd', { from: moment })).toEqual({ weekday: 'long' })
    expect(toIntlOptions('ddd', { from: moment })).toEqual({ weekday: 'short' })
    expect(toIntlOptions('EEEEE', { from: ldml })).toEqual({ weekday: 'narrow' })
    expect(toIntlOptions('G', { from: ldml })).toEqual({ era: 'short' })
    expect(toIntlOptions('GGGGG', { from: ldml })).toEqual({ era: 'narrow' })
  })

  it('maps fractional seconds and the zone family', () => {
    expect(toIntlOptions('SSS', { from: ldml })).toEqual({ fractionalSecondDigits: 3 })
    expect(toIntlOptions('z', { from: moment })).toEqual({ timeZoneName: 'short' })
    expect(toIntlOptions('Z', { from: moment })).toEqual({ timeZoneName: 'longOffset' })
    expect(toIntlOptions('ZZ', { from: moment })).toEqual({ timeZoneName: 'shortOffset' })
  })

  it('maps the localized presets to the style axis', () => {
    expect(toIntlOptions('L', { from: dayjs })).toEqual({ dateStyle: 'short' })
    expect(toIntlOptions('LT', { from: moment })).toEqual({ timeStyle: 'short' })
    expect(toIntlOptions('LLLL', { from: momentjs })).toEqual({ dateStyle: 'full', timeStyle: 'full' })
  })

  it('drops literals and field order — the locale decides layout', () => {
    const slashes = toIntlOptions('DD/MM/YYYY', { from: moment })
    const dashes = toIntlOptions('YYYY-MM-DD', { from: moment })
    expect(slashes).toEqual({ year: 'numeric', month: '2-digit', day: '2-digit' })
    expect(slashes).toEqual(dashes)
  })

  it('drops both quoted literals and unmappable fields, keeping the rest', () => {
    expect(toIntlOptions('[Q]Q YYYY', { from: moment })).toEqual({ year: 'numeric' })
  })

  it('drops the AM/PM marker — it is implied by an h11/h12 hour cycle', () => {
    expect(toIntlOptions('h:mm A', { from: moment })).toEqual({ hour: 'numeric', minute: '2-digit', hourCycle: 'h12' })
  })

  describe('fields with no Intl equivalent', () => {
    it('drops them by default', () => {
      expect(toIntlOptions('Q', { from: moment })).toEqual({})
      expect(toIntlOptions('dd', { from: moment })).toEqual({}) // weekday/short
      expect(toIntlOptions('LLLL', { from: ldml })).toEqual({}) // month/wide/standalone
      expect(toIntlOptions('Mo D', { from: moment })).toEqual({ day: 'numeric' }) // ordinal dropped
    })

    it('throws under the throw policy', () => {
      expect(() => toIntlOptions('Q', { from: moment, onUnsupportedToken: 'throw' })).toThrow(/Q/)
      expect(() => toIntlOptions('LLLL', { from: ldml, onUnsupportedToken: 'throw' })).toThrow()
    })

    it('reports an unrecognized token', () => {
      expect(() => toIntlOptions('J', { from: moment, onUnsupportedToken: 'throw' })).toThrow(/J/)
    })
  })

  describe('a key claimed twice with different values', () => {
    it('keeps the first and drops the second by default', () => {
      expect(toIntlOptions('MMM MM', { from: moment })).toEqual({ month: 'short' })
    })

    it('throws under the throw policy', () => {
      expect(() => toIntlOptions('MMM MM', { from: moment, onUnsupportedToken: 'throw' })).toThrow(/MM/)
    })
  })
})

describe('fromIntlOptions', () => {
  it('maps the style axis to the target localized presets', () => {
    expect(fromIntlOptions({ dateStyle: 'short' }, { to: dayjs })).toBe('L')
    expect(fromIntlOptions({ dateStyle: 'long', timeStyle: 'long' }, { to: dayjs })).toBe('LLL')
    expect(fromIntlOptions({ timeStyle: 'short' }, { to: momentjs })).toBe('LT')
    expect(fromIntlOptions({ dateStyle: 'long', timeStyle: 'long' }, { to: dateFns })).toBe('PPPppp')
  })

  it('renders components as a skeleton in CLDR canonical order', () => {
    expect(fromIntlOptions({ year: 'numeric', month: '2-digit', day: '2-digit' }, { to: ldml })).toBe('yyyyMMdd')
    expect(fromIntlOptions({ hour: '2-digit', minute: '2-digit' }, { to: moment })).toBe('HHmm')
  })

  it('maps each component back in canonical order', () => {
    expect(fromIntlOptions({ era: 'short', year: 'numeric' }, { to: ldml })).toBe('GGGyyyy')
    expect(fromIntlOptions({ weekday: 'long' }, { to: moment })).toBe('dddd')
    expect(fromIntlOptions({ minute: '2-digit', second: '2-digit' }, { to: moment })).toBe('mmss')
    expect(fromIntlOptions({ fractionalSecondDigits: 3 }, { to: moment })).toBe('SSS')
    expect(fromIntlOptions({ timeZoneName: 'short' }, { to: moment })).toBe('z')
    expect(fromIntlOptions({ timeZoneName: 'longOffset' }, { to: moment })).toBe('Z')
    expect(fromIntlOptions({ timeZoneName: 'shortOffset' }, { to: moment })).toBe('ZZ')
  })

  it('defaults a missing hour cycle to h23, honoring legacy hour12', () => {
    expect(fromIntlOptions({ hour: '2-digit', minute: '2-digit' }, { to: moment })).toBe('HHmm')
    expect(fromIntlOptions({ hour: 'numeric', hour12: true }, { to: moment })).toBe('h')
  })

  it('honors an explicit hour cycle', () => {
    expect(fromIntlOptions({ hour: 'numeric', hourCycle: 'h11' }, { to: ldml })).toBe('K')
    expect(fromIntlOptions({ hour: '2-digit', hourCycle: 'h24' }, { to: moment })).toBe('kk')
  })

  it('combines a date and time preset at the same level', () => {
    expect(fromIntlOptions({ dateStyle: 'short', timeStyle: 'short' }, { to: dateFns })).toBe('Pp')
  })

  it('treats legacy hour12: false as h23', () => {
    expect(fromIntlOptions({ hour: 'numeric', hour12: false }, { to: moment })).toBe('H')
  })

  describe('options the target cannot render', () => {
    it('drops a preset against a pure dialect with no preset token', () => {
      expect(fromIntlOptions({ dateStyle: 'short' }, { to: ldml })).toBe('')
    })

    it('drops a preset level the library lacks', () => {
      expect(fromIntlOptions({ dateStyle: 'full' }, { to: dayjs })).toBe('')
      expect(fromIntlOptions({ timeStyle: 'long' }, { to: dayjs })).toBe('')
    })

    it('drops a field the dialect defines but the library gates out of supports', () => {
      // `era` lives in the moment grammar, but Day.js does not render it.
      expect(fromIntlOptions({ era: 'short' }, { to: dayjs })).toBe('')
    })

    it('drops a dateStyle/timeStyle mismatch with no fused preset', () => {
      expect(fromIntlOptions({ dateStyle: 'full', timeStyle: 'short' }, { to: dateFns })).toBe('')
    })

    it('drops an Intl-only zone style and the flexible day period', () => {
      expect(fromIntlOptions({ timeZoneName: 'long' }, { to: moment })).toBe('')
      expect(fromIntlOptions({ dayPeriod: 'short', hour: 'numeric' }, { to: moment })).toBe('H')
    })

    it('throws under the throw policy', () => {
      expect(() => fromIntlOptions({ dateStyle: 'short' }, { to: ldml, onUnsupportedToken: 'throw' })).toThrow()
      expect(() => fromIntlOptions({ dateStyle: 'full', timeStyle: 'short' }, { to: dateFns, onUnsupportedToken: 'throw' })).toThrow()
      expect(() => fromIntlOptions({ timeZoneName: 'long' }, { to: moment, onUnsupportedToken: 'throw' })).toThrow()
      expect(() => fromIntlOptions({ dayPeriod: 'short' }, { to: moment, onUnsupportedToken: 'throw' })).toThrow()
    })

    it('distinguishes unsupported-by-target from unmappable in the thrown reason', () => {
      // A dialect-defined field the library gates → "not rendered by the target library".
      expect(() => fromIntlOptions({ era: 'short' }, { to: dayjs, onUnsupportedToken: 'throw' }))
        .toThrow(/not rendered by the target library/)
      // A field with no token in the target dialect at all → "no equivalent".
      expect(() => fromIntlOptions({ dateStyle: 'short' }, { to: ldml, onUnsupportedToken: 'throw' }))
        .toThrow(/no equivalent in the target dialect/)
    })
  })
})

describe('round trip across the Intl boundary', () => {
  it('preserves the component set (not the layout)', () => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' } as const
    const pattern = fromIntlOptions(options, { to: ldml })
    expect(toIntlOptions(pattern, { from: ldml })).toEqual(options)
  })

  it('preserves the style through the preset axis', () => {
    const options = { dateStyle: 'long', timeStyle: 'long' } as const
    const pattern = fromIntlOptions(options, { to: dateFns })
    expect(toIntlOptions(pattern, { from: dateFns })).toEqual(options)
  })
})

describe('forward/reverse table consistency', () => {
  it('round-trips every Intl-mappable canonical back to itself', () => {
    // Guards against the forward and reverse tables drifting apart: any canonical
    // the forward table maps must decode back to exactly that canonical.
    for (const canonical of Object.values(Canonical)) {
      const options = canonicalToIntl(canonical)
      if (options === undefined)
        continue
      expect(intlToCanonical(options)).toEqual({ tokens: [canonical], unsupported: [] })
    }
  })
})
