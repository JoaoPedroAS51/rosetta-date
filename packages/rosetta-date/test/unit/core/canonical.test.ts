import { Canonical, decodeCanonical } from 'rosetta-date'
import { describe, expect, it } from 'vitest'

// Presentation qualifiers refine only the rendered surface, so the grammar's
// order rule places them after identity qualifiers, which change the value.
const PRESENTATION_QUALIFIERS = new Set(['space-padded', 'lower'])

describe('canonical vocabulary', () => {
  it.for([
    { member: 'YearNumeric', value: 'year/numeric' },
    { member: 'DayOfMonthTwoDigit', value: 'day-of-month/2-digit' },
  ] as const)('exposes $member as "$value"', ({ member, value }) => {
    expect(Canonical[member]).toBe(value)
  })

  it('orders identity qualifiers before presentation qualifiers in every value', () => {
    const offenders = Object.values(Canonical).filter((value) => {
      const { qualifiers } = decodeCanonical(value)
      const firstPresentation = qualifiers.findIndex(q => PRESENTATION_QUALIFIERS.has(q))
      return firstPresentation !== -1 && qualifiers.slice(firstPresentation).some(q => !PRESENTATION_QUALIFIERS.has(q))
    })
    expect(offenders).toEqual([])
  })
})
