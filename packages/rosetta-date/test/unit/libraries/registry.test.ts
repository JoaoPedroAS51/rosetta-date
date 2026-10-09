import { dateFns, dayjs, getLibrary, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'

describe('getLibrary', () => {
  it.for([
    { name: 'dayjs', library: dayjs },
    { name: 'date-fns', library: dateFns },
    { name: 'momentjs', library: momentjs },
  ] as const)('returns the $name library', ({ name, library }) => {
    expect(getLibrary(name)).toBe(library)
  })
})
