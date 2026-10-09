import { Canonical, decodeCanonical } from 'rosetta-date'
import { describe, expect, it } from 'vitest'

describe('decodeCanonical', () => {
  it.for([
    { canonical: Canonical.HourTwoDigitH23, expected: { field: 'hour', style: '2-digit', qualifiers: ['h23'] } },
    { canonical: Canonical.MinuteNumeric, expected: { field: 'minute', style: 'numeric', qualifiers: [] } },
    { canonical: Canonical.WeekOfYearOrdinalIso, expected: { field: 'week-of-year', style: 'ordinal', qualifiers: ['iso'] } },
    { canonical: Canonical.MonthWideStandalone, expected: { field: 'month', style: 'wide', qualifiers: ['standalone'] } },
  ])('splits "$canonical" into field, style and qualifiers', ({ canonical, expected }) => {
    expect(decodeCanonical(canonical)).toEqual(expected)
  })

  it.for([
    { canonical: Canonical.DayOfMonthNumeric, field: 'day-of-month' },
    { canonical: Canonical.LocalizedDateTimeFull, field: 'localized-date-time' },
  ])('keeps the hyphens inside the field of "$canonical"', ({ canonical, field }) => {
    expect(decodeCanonical(canonical).field).toBe(field)
  })
})
