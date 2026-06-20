import { expect, describe as group, it } from 'vitest'
import { Canonical } from './core/canonical'
import { ldml } from './dialects/ldml'
import { moment } from './dialects/moment'
import { explain } from './explain'
import { dayjs } from './libraries/dayjs'
import { momentjs } from './libraries/momentjs'

group('explain', () => {
  it('reports a field that converts, with its target spelling', () => {
    expect(explain('DD', { from: moment, to: ldml })).toEqual([
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [], status: 'converted', target: 'dd' },
    ])
  })

  it('flags a field with no token in the target grammar as unmappable', () => {
    expect(explain('X', { from: momentjs, to: ldml })).toEqual([
      { kind: 'field', token: 'X', canonical: Canonical.EpochSeconds, field: 'epoch', style: 'seconds', qualifiers: [], status: 'unsupported', reason: 'unmappable' },
    ])
  })

  it('flags a field the grammar defines but the library gates as unsupported-by-target', () => {
    // The moment grammar has `N` for the era, but Day.js does not render it.
    expect(explain('N', { from: momentjs, to: dayjs })).toEqual([
      { kind: 'field', token: 'N', canonical: Canonical.EraAbbreviated, field: 'era', style: 'abbreviated', qualifiers: [], status: 'unsupported', reason: 'unsupported-by-target' },
    ])
  })

  it('converts to a bare dialect that defines the field, in its primary spelling', () => {
    // A pure dialect has no `supports` gate, so the same era converts here —
    // to ldml's primary `GGG` spelling, never the `G`/`GG` aliases.
    expect(explain('N', { from: momentjs, to: ldml })).toEqual([
      { kind: 'field', token: 'N', canonical: Canonical.EraAbbreviated, field: 'era', style: 'abbreviated', qualifiers: [], status: 'converted', target: 'GGG' },
    ])
  })

  it('passes literals and unrecognized runs through unchanged', () => {
    expect(explain('[on] J', { from: moment, to: ldml })).toEqual([
      { kind: 'literal', value: 'on ' },
      { kind: 'unknown', value: 'J' },
    ])
  })

  it('explains a mixed pattern, in order', () => {
    expect(explain('YYYY-MM-DD', { from: momentjs, to: dayjs })).toEqual([
      { kind: 'field', token: 'YYYY', canonical: Canonical.YearNumeric, field: 'year', style: 'numeric', qualifiers: [], status: 'converted', target: 'YYYY' },
      { kind: 'literal', value: '-' },
      { kind: 'field', token: 'MM', canonical: Canonical.MonthTwoDigit, field: 'month', style: '2-digit', qualifiers: [], status: 'converted', target: 'MM' },
      { kind: 'literal', value: '-' },
      { kind: 'field', token: 'DD', canonical: Canonical.DayOfMonthTwoDigit, field: 'day-of-month', style: '2-digit', qualifiers: [], status: 'converted', target: 'DD' },
    ])
  })
})
