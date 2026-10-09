import { getDialect, ldml, moment, strftime } from 'rosetta-date/dialects'
import { describe, expect, it } from 'vitest'

describe('getDialect', () => {
  it.for([
    { name: 'moment', dialect: moment },
    { name: 'ldml', dialect: ldml },
    { name: 'strftime', dialect: strftime },
  ] as const)('returns the $name dialect', ({ name, dialect }) => {
    expect(getDialect(name)).toBe(dialect)
  })
})
