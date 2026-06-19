import { expect, describe as group, it } from 'vitest'
import { Canonical } from './core/canonical'
import { describe } from './describe'
import { ldml } from './dialects/ldml'
import { moment } from './dialects/moment'
import { dateFns } from './libraries/date-fns'
import { dayjs } from './libraries/dayjs'

group('describe', () => {
  it('decodes a recognized field into its canonical parts', () => {
    expect(describe('DD', moment)).toEqual([
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [] },
    ])
  })

  it('surfaces trailing qualifiers (hour cycle, standalone)', () => {
    expect(describe('K', ldml)).toEqual([
      { kind: 'field', token: 'K', canonical: Canonical.HourNumericH11, field: 'hour', style: 'numeric', qualifiers: ['h11'] },
    ])
    expect(describe('LLLL', ldml)).toEqual([
      { kind: 'field', token: 'LLLL', canonical: Canonical.MonthWideStandalone, field: 'month', style: 'wide', qualifiers: ['standalone'] },
    ])
  })

  it('passes a literal through verbatim', () => {
    expect(describe('[Year]', moment)).toEqual([{ kind: 'literal', value: 'Year' }])
  })

  it('passes an unrecognized run through verbatim', () => {
    expect(describe('J', moment)).toEqual([{ kind: 'unknown', value: 'J' }])
  })

  it('describes a full pattern in order, covering every segment', () => {
    expect(describe('DD/MM/YYYY', moment)).toEqual([
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [] },
      { kind: 'literal', value: '/' },
      { kind: 'field', token: 'MM', canonical: Canonical.MonthTwoDigit, field: 'month', style: '2-digit', qualifiers: [] },
      { kind: 'literal', value: '/' },
      { kind: 'field', token: 'YYYY', canonical: Canonical.YearNumeric, field: 'year', style: 'numeric', qualifiers: [] },
    ])
  })

  it('resolves a library to its effective grammar, including extensions', () => {
    // date-fns adds ISO week tokens via `extends`.
    expect(describe('I', dateFns)).toEqual([
      { kind: 'field', token: 'I', canonical: Canonical.WeekOfYearNumericIso, field: 'week-of-year', style: 'numeric', qualifiers: ['iso'] },
    ])
    // Day.js parses through the moment grammar.
    expect(describe('L', dayjs)).toEqual([
      { kind: 'field', token: 'L', canonical: Canonical.LocalizedDateShort, field: 'localized-date', style: 'short', qualifiers: [] },
    ])
  })

  it('returns an empty array for an empty format', () => {
    expect(describe('', moment)).toEqual([])
  })
})
