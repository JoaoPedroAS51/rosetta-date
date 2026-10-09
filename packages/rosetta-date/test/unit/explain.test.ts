import { Canonical, explain } from 'rosetta-date'
import { ldml, moment, strftime } from 'rosetta-date/dialects'
import { dayjs, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'

describe('explain', () => {
  it('reports a converted field with its target spelling', () => {
    expect(explain('DD', { from: moment, to: ldml })).toEqual([
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [], status: 'converted', target: 'dd' },
    ])
  })

  it('reports a field with no token in the target grammar as unmappable', () => {
    expect(explain('X', { from: momentjs, to: ldml })).toEqual([
      { kind: 'field', token: 'X', canonical: Canonical.EpochSeconds, field: 'epoch', style: 'seconds', qualifiers: [], status: 'unsupported', reason: 'unmappable' },
    ])
  })

  // The moment grammar has `N` for the era, but Day.js does not render it.
  it('reports a field the target library does not render as unsupported-by-target', () => {
    expect(explain('N', { from: momentjs, to: dayjs })).toEqual([
      { kind: 'field', token: 'N', canonical: Canonical.EraAbbreviated, field: 'era', style: 'abbreviated', qualifiers: [], status: 'unsupported', reason: 'unsupported-by-target' },
    ])
  })

  // LDML spells the abbreviated era `G`, `GG` and `GGG`; `GGG` comes first in its table.
  it('reports the primary spelling of a dialect with several tokens for the field', () => {
    expect(explain('N', { from: momentjs, to: ldml })).toEqual([
      { kind: 'field', token: 'N', canonical: Canonical.EraAbbreviated, field: 'era', style: 'abbreviated', qualifiers: [], status: 'converted', target: 'GGG' },
    ])
  })

  it('returns literals and unrecognized runs unchanged', () => {
    expect(explain('[on] J', { from: moment, to: ldml })).toEqual([
      { kind: 'literal', value: 'on ' },
      { kind: 'unknown', value: 'J' },
    ])
  })

  it('explains every segment of a pattern in order', () => {
    expect(explain('YYYY-MM-DD', { from: momentjs, to: dayjs })).toEqual([
      { kind: 'field', token: 'YYYY', canonical: Canonical.YearNumeric, field: 'year', style: 'numeric', qualifiers: [], status: 'converted', target: 'YYYY' },
      { kind: 'literal', value: '-' },
      { kind: 'field', token: 'MM', canonical: Canonical.MonthTwoDigit, field: 'month', style: '2-digit', qualifiers: [], status: 'converted', target: 'MM' },
      { kind: 'literal', value: '-' },
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [], status: 'converted', target: 'DD' },
    ])
  })

  it('explains each field of a composite', () => {
    expect(explain('%T', { from: strftime, to: moment })).toMatchObject([
      { kind: 'field', token: '%H', status: 'converted', target: 'HH' },
      { kind: 'literal', value: ':' },
      { kind: 'field', token: '%M', status: 'converted', target: 'mm' },
      { kind: 'literal', value: ':' },
      { kind: 'field', token: '%S', status: 'converted', target: 'ss' },
    ])
  })
})
