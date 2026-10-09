import { ldml, moment, strftime } from 'rosetta-date/dialects'
import { toIntlOptions } from 'rosetta-date/intl'
import { dayjs, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'
import { unsupportedError } from '../../fixtures/errors'

describe('toIntlOptions', () => {
  it('reads the fields of a pattern into an options object, with the hour cycle split out', () => {
    expect(toIntlOptions('YYYY-MM-DD HH:mm', { from: moment })).toEqual({
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  })

  it('reads a strftime pattern', () => {
    expect(toIntlOptions('%Y-%m-%d %H:%M', { from: strftime })).toEqual({
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  })

  it.for([
    { format: 'h', expected: { hour: 'numeric', hourCycle: 'h12' } },
    { format: 'k', expected: { hour: 'numeric', hourCycle: 'h24' } },
    { format: 'HH', expected: { hour: '2-digit', hourCycle: 'h23' } },
  ])('maps moment "$format" to its hour cycle', ({ format, expected }) => {
    expect(toIntlOptions(format, { from: moment })).toEqual(expected)
  })

  it.for([
    { format: 'MMMM', from: moment, expected: { month: 'long' } },
    { format: 'MMM', from: moment, expected: { month: 'short' } },
    { format: 'MMMMM', from: ldml, expected: { month: 'narrow' } },
    { format: 'GGGG', from: ldml, expected: { era: 'long' } },
    { format: 'G', from: ldml, expected: { era: 'short' } },
    { format: 'GGGGG', from: ldml, expected: { era: 'narrow' } },
    { format: 'dddd', from: moment, expected: { weekday: 'long' } },
    { format: 'ddd', from: moment, expected: { weekday: 'short' } },
    { format: 'EEEEE', from: ldml, expected: { weekday: 'narrow' } },
  ])('maps the name width of $from.name "$format"', ({ format, from, expected }) => {
    expect(toIntlOptions(format, { from })).toEqual(expected)
  })

  it.for([
    { format: 'ss', from: moment, expected: { second: '2-digit' } },
    { format: 'SSS', from: ldml, expected: { fractionalSecondDigits: 3 } },
    { format: 'z', from: moment, expected: { timeZoneName: 'short' } },
    { format: 'Z', from: moment, expected: { timeZoneName: 'longOffset' } },
    { format: 'ZZ', from: moment, expected: { timeZoneName: 'shortOffset' } },
  ])('maps $from.name "$format"', ({ format, from, expected }) => {
    expect(toIntlOptions(format, { from })).toEqual(expected)
  })

  it.for([
    { format: 'L', from: dayjs, expected: { dateStyle: 'short' } },
    { format: 'LT', from: moment, expected: { timeStyle: 'short' } },
    { format: 'LLLL', from: momentjs, expected: { dateStyle: 'full', timeStyle: 'full' } },
  ])('maps the localized preset "$format" to the style options', ({ format, from, expected }) => {
    expect(toIntlOptions(format, { from })).toEqual(expected)
  })

  it('ignores literals and field order', () => {
    const expected = { year: 'numeric', month: '2-digit', day: '2-digit' }
    expect(toIntlOptions('DD/MM/YYYY', { from: moment })).toEqual(expected)
    expect(toIntlOptions('YYYY-MM-DD', { from: moment })).toEqual(expected)
  })

  it('keeps the mappable fields of a pattern with literals and unmappable fields', () => {
    expect(toIntlOptions('[Q]Q YYYY', { from: moment })).toEqual({ year: 'numeric' })
  })

  it('omits the AM/PM marker implied by a 12-hour cycle', () => {
    expect(toIntlOptions('h:mm A', { from: moment })).toEqual({ hour: 'numeric', minute: '2-digit', hourCycle: 'h12' })
  })

  describe('fields with no Intl equivalent', () => {
    it.for([
      { format: 'Q', from: moment, field: 'quarter', expected: {} },
      { format: 'dd', from: moment, field: 'short weekday', expected: {} },
      { format: 'LLLL', from: ldml, field: 'standalone month', expected: {} },
      { format: 'Mo D', from: moment, field: 'month ordinal', expected: { day: 'numeric' } },
    ])('drops the $field in $from.name "$format" by default', ({ format, from, expected }) => {
      expect(toIntlOptions(format, { from })).toEqual(expected)
    })

    it.for([
      { format: 'Q', from: moment, token: 'Q', reason: 'unmappable' },
      { format: 'LLLL', from: ldml, token: 'LLLL', reason: 'unmappable' },
      { format: 'J', from: moment, token: 'J', reason: 'unrecognized' },
    ] as const)('throws for $from.name "$format" under the throw policy', ({ format, from, token, reason }) => {
      expect(() => toIntlOptions(format, { from, onUnsupportedToken: 'throw' })).toThrow(unsupportedError(token, reason))
    })
  })

  describe('an option claimed twice with different values', () => {
    it('keeps the first value by default', () => {
      expect(toIntlOptions('MMM MM', { from: moment })).toEqual({ month: 'short' })
    })

    it('throws for the second token under the throw policy', () => {
      expect(() => toIntlOptions('MMM MM', { from: moment, onUnsupportedToken: 'throw' })).toThrow(unsupportedError('MM', 'unmappable'))
    })
  })
})
