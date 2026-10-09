import { convert, createConverter } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'
import { dayjs, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'

describe('convert', () => {
  it.for([
    { format: 'DD/MM/YYYY', from: moment, to: ldml, expected: 'dd/MM/yyyy' },
    { format: 'yyyy-MM-dd', from: ldml, to: moment, expected: 'YYYY-MM-DD' },
  ])('converts "$format" from $from.name to $to.name', ({ format, from, to, expected }) => {
    expect(convert(format, { from, to })).toBe(expected)
  })

  it('returns the format unchanged when source and target are the same dialect', () => {
    expect(convert('DD/MM/YYYY', { from: moment, to: moment })).toBe('DD/MM/YYYY')
  })

  it('returns an empty string for an empty format', () => {
    expect(convert('', { from: moment, to: ldml })).toBe('')
  })

  it.for([
    { format: 'YYYY', expected: 'yyyy' },
    { format: 'DD', expected: 'dd' },
  ])('maps moment "$format" to its own field, not the same LDML letters', ({ format, expected }) => {
    expect(convert(format, { from: moment, to: ldml })).toBe(expected)
  })
})

describe('createConverter', () => {
  it.for([
    { format: 'YYYY-MM-DD', expected: 'yyyy-MM-dd' },
    { format: 'hh:mm A', expected: 'hh:mm a' },
  ])('converts "$format" in the bound direction', ({ format, expected }) => {
    const toLdml = createConverter(moment, ldml)
    expect(toLdml(format)).toBe(expected)
  })

  it('reuses the same converter for different formats', () => {
    const toLdml = createConverter(moment, ldml)
    expect(toLdml('YYYY-MM-DD')).toBe('yyyy-MM-dd')
    expect(toLdml('hh:mm A')).toBe('hh:mm a')
  })

  it('returns the same result as convert for the same direction', () => {
    const toMoment = createConverter(ldml, moment)
    expect(toMoment('dd/MM/yyyy')).toBe(convert('dd/MM/yyyy', { from: ldml, to: moment }))
  })

  it('accepts libraries as both endpoints', () => {
    const toDayjs = createConverter(momentjs, dayjs)
    expect(toDayjs('YYYY-MM-DD')).toBe('YYYY-MM-DD')
  })
})
