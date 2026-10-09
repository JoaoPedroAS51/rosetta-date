import { ldml, moment, strftime } from 'rosetta-date/dialects'
import { fromIntlOptions, toIntlOptions } from 'rosetta-date/intl'
import { dateFns, dayjs, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'
import { unsupportedError } from '../../fixtures/errors'

describe('fromIntlOptions', () => {
  it.for([
    { options: { dateStyle: 'short' }, to: dayjs, expected: 'L' },
    { options: { dateStyle: 'long', timeStyle: 'long' }, to: dayjs, expected: 'LLL' },
    { options: { timeStyle: 'short' }, to: momentjs, expected: 'LT' },
    { options: { dateStyle: 'long', timeStyle: 'long' }, to: dateFns, expected: 'PPPppp' },
    { options: { dateStyle: 'short', timeStyle: 'short' }, to: dateFns, expected: 'Pp' },
  ] as const)('renders the style options as the $to.name preset "$expected"', ({ options, to, expected }) => {
    expect(fromIntlOptions(options, { to })).toBe(expected)
  })

  it.for([
    { options: { year: 'numeric', month: '2-digit', day: '2-digit' }, to: ldml, expected: 'yyyyMMdd' },
    { options: { era: 'short', year: 'numeric' }, to: ldml, expected: 'GGGyyyy' },
    { options: { hour: '2-digit', minute: '2-digit' }, to: moment, expected: 'HHmm' },
    { options: { minute: '2-digit', second: '2-digit' }, to: moment, expected: 'mmss' },
    { options: { year: 'numeric', month: '2-digit', day: '2-digit' }, to: strftime, expected: '%Y%m%d' },
  ] as const)('renders the fields as the $to.name skeleton "$expected" in canonical order', ({ options, to, expected }) => {
    expect(fromIntlOptions(options, { to })).toBe(expected)
  })

  it.for([
    { options: { weekday: 'long' }, expected: 'dddd' },
    { options: { fractionalSecondDigits: 3 }, expected: 'SSS' },
    { options: { timeZoneName: 'short' }, expected: 'z' },
    { options: { timeZoneName: 'longOffset' }, expected: 'Z' },
    { options: { timeZoneName: 'shortOffset' }, expected: 'ZZ' },
  ] as const)('renders $options as moment "$expected"', ({ options, expected }) => {
    expect(fromIntlOptions(options, { to: moment })).toBe(expected)
  })

  describe('hour cycle', () => {
    it.for([
      { case: 'a missing hour cycle as h23', options: { hour: 'numeric' }, to: moment, expected: 'H' },
      { case: 'hour12: true as h12', options: { hour: 'numeric', hour12: true }, to: moment, expected: 'h' },
      { case: 'hour12: false as h23', options: { hour: 'numeric', hour12: false }, to: moment, expected: 'H' },
      { case: 'an explicit h11', options: { hour: 'numeric', hourCycle: 'h11' }, to: ldml, expected: 'K' },
      { case: 'an explicit h24', options: { hour: '2-digit', hourCycle: 'h24' }, to: moment, expected: 'kk' },
      { case: 'a missing hour cycle in strftime as h23', options: { hour: 'numeric', minute: '2-digit' }, to: strftime, expected: '%-H%M' },
    ] as const)('reads $case', ({ options, to, expected }) => {
      expect(fromIntlOptions(options, { to })).toBe(expected)
    })
  })

  describe('options the target cannot render', () => {
    it.for([
      { case: 'a preset for a dialect with no preset token', options: { dateStyle: 'short' }, to: ldml },
      { case: 'a date style level the library lacks', options: { dateStyle: 'full' }, to: dayjs },
      { case: 'a time style level the library lacks', options: { timeStyle: 'long' }, to: dayjs },
      { case: 'a field the library does not render', options: { era: 'short' }, to: dayjs },
      { case: 'a date and time style with no combined preset', options: { dateStyle: 'full', timeStyle: 'short' }, to: dateFns },
      { case: 'an Intl-only zone style', options: { timeZoneName: 'long' }, to: moment },
      { case: 'the flexible day period', options: { dayPeriod: 'short' }, to: moment },
    ] as const)('drops $case by default', ({ options, to }) => {
      expect(fromIntlOptions(options, { to })).toBe('')
    })

    it('keeps the renderable options next to a dropped one', () => {
      expect(fromIntlOptions({ dayPeriod: 'short', hour: 'numeric' }, { to: moment })).toBe('H')
    })

    it.for([
      { options: { dateStyle: 'short' }, to: ldml, token: 'localized-date/short', reason: 'unmappable' },
      { options: { era: 'short' }, to: dayjs, token: 'era/abbreviated', reason: 'unsupported-by-target' },
      { options: { dateStyle: 'full', timeStyle: 'short' }, to: dateFns, token: 'dateStyle:full+timeStyle:short', reason: 'unmappable' },
      { options: { timeZoneName: 'long' }, to: moment, token: 'timeZoneName:long', reason: 'unmappable' },
      { options: { dayPeriod: 'short' }, to: moment, token: 'dayPeriod:short', reason: 'unmappable' },
    ] as const)('throws $reason for "$token" under the throw policy', ({ options, to, token, reason }) => {
      expect(() => fromIntlOptions(options, { to, onUnsupportedToken: 'throw' })).toThrow(unsupportedError(token, reason))
    })
  })
})

describe('round trip through Intl options', () => {
  it('keeps the field options', () => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' } as const
    expect(toIntlOptions(fromIntlOptions(options, { to: ldml }), { from: ldml })).toEqual(options)
  })

  it('keeps the style options', () => {
    const options = { dateStyle: 'long', timeStyle: 'long' } as const
    expect(toIntlOptions(fromIntlOptions(options, { to: dateFns }), { from: dateFns })).toEqual(options)
  })
})
