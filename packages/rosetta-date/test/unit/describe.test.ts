import { Canonical, describe as describePattern } from 'rosetta-date'
import { ldml, moment, strftime } from 'rosetta-date/dialects'
import { dateFns, dayjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'

describe('describe', () => {
  it('decodes a recognized field into its canonical parts', () => {
    expect(describePattern('DD', moment)).toEqual([
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [] },
    ])
  })

  it.for([
    { token: 'K', canonical: Canonical.HourNumericH11, field: 'hour', style: 'numeric', qualifiers: ['h11'] },
    { token: 'LLLL', canonical: Canonical.MonthWideStandalone, field: 'month', style: 'wide', qualifiers: ['standalone'] },
  ])('lists the qualifiers of "$token"', ({ token, ...decoded }) => {
    expect(describePattern(token, ldml)).toEqual([{ kind: 'field', token, ...decoded }])
  })

  it('returns a literal verbatim', () => {
    expect(describePattern('[Year]', moment)).toEqual([{ kind: 'literal', value: 'Year' }])
  })

  it('returns an unrecognized run verbatim', () => {
    expect(describePattern('J', moment)).toEqual([{ kind: 'unknown', value: 'J' }])
  })

  it('describes every segment of a pattern in order', () => {
    expect(describePattern('DD/MM/YYYY', moment)).toEqual([
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [] },
      { kind: 'literal', value: '/' },
      { kind: 'field', token: 'MM', canonical: Canonical.MonthTwoDigit, field: 'month', style: '2-digit', qualifiers: [] },
      { kind: 'literal', value: '/' },
      { kind: 'field', token: 'YYYY', canonical: Canonical.YearNumeric, field: 'year', style: 'numeric', qualifiers: [] },
    ])
  })

  it('reads a library extension token', () => {
    expect(describePattern('I', dateFns)).toEqual([
      { kind: 'field', token: 'I', canonical: Canonical.WeekOfYearNumericIso, field: 'week-of-year', style: 'numeric', qualifiers: ['iso'] },
    ])
  })

  it('reads a library token through its base dialect', () => {
    expect(describePattern('L', dayjs)).toEqual([
      { kind: 'field', token: 'L', canonical: Canonical.LocalizedDateShort, field: 'localized-date', style: 'short', qualifiers: [] },
    ])
  })

  it('describes a composite as the segments it expands to', () => {
    expect(describePattern('%T', strftime)).toMatchObject([
      { kind: 'field', token: '%H', canonical: Canonical.HourTwoDigitH23 },
      { kind: 'literal', value: ':' },
      { kind: 'field', token: '%M', canonical: Canonical.MinuteTwoDigit },
      { kind: 'literal', value: ':' },
      { kind: 'field', token: '%S', canonical: Canonical.SecondTwoDigit },
    ])
  })

  it('returns an empty array for an empty format', () => {
    expect(describePattern('', moment)).toEqual([])
  })
})
