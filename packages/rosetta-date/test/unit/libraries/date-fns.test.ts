import { convert } from 'rosetta-date'
import { dateFns, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'

function dateFnsToMoment(format: string): string {
  return convert(format, { from: dateFns, to: momentjs })
}

describe('localized presets of different widths', () => {
  it.for([
    { format: 'PPpp', expected: 'lll' },
    { format: 'PPPppp', expected: 'LLL' },
    { format: 'PP p', expected: 'll LT' },
  ])('converts "$format" to "$expected"', ({ format, expected }) => {
    expect(dateFnsToMoment(format)).toBe(expected)
  })

  // `ll` + `LT` reads back cleanly; only the locale's connector between the two is lost.
  it('concatenates presets whose tokens do not merge', () => {
    expect(dateFnsToMoment('PPp')).toBe('llLT')
  })

  // `LL` + `LT` would read back as `LLL` + `T`.
  it.for([
    { format: 'PPPp', expected: 'LL[]LT' },
    { format: 'PPPpp', expected: 'LL[]LTS' },
  ])('separates the presets of "$format" with an empty literal', ({ format, expected }) => {
    expect(dateFnsToMoment(format)).toBe(expected)
  })

  it.for(['PPPp', 'PPPpp'])('converts the separated form of "%s" back to date-fns', (format) => {
    expect(convert(dateFnsToMoment(format), { from: momentjs, to: dateFns })).toBe(format)
  })
})
