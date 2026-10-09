import type { LibraryDefinition } from 'rosetta-date'
import { Canonical, convert, defineLibrary } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'
import { dateFns } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'

describe('defineLibrary', () => {
  it.for<{ case: string, definition: LibraryDefinition }>([
    {
      case: 'a supports subset the dialect expresses',
      definition: { name: 'ok', dialect: moment, supports: new Set([Canonical.YearNumeric, Canonical.MonthTwoDigit]) },
    },
    {
      case: 'a supports set that includes an extension canonical',
      definition: {
        name: 'ext-subset',
        dialect: ldml,
        extends: [{ token: 'tt', canonical: Canonical.EpochSeconds }],
        supports: new Set([Canonical.MonthNumeric, Canonical.EpochSeconds]),
      },
    },
  ])('accepts $case', ({ definition }) => {
    expect(() => defineLibrary(definition)).not.toThrow()
  })

  it.for<{ case: string, definition: LibraryDefinition, error: RegExp }>([
    {
      case: 'a supported canonical the dialect cannot express',
      definition: { name: 'broken', dialect: moment, supports: new Set([Canonical.HourNumericH11]) },
      error: /h11/,
    },
    {
      case: 'an extension token that collides with a dialect token',
      definition: { name: 'bad', dialect: ldml, extends: [{ token: 'M', canonical: Canonical.EpochSeconds }] },
      error: /already defines/,
    },
    {
      case: 'an extension token listed twice',
      definition: {
        name: 'dup',
        dialect: ldml,
        extends: [
          { token: 'tt', canonical: Canonical.EpochSeconds },
          { token: 'tt', canonical: Canonical.EpochMilliseconds },
        ],
      },
      error: /more than once/,
    },
  ])('rejects $case', ({ definition, error }) => {
    expect(() => defineLibrary(definition)).toThrow(error)
  })
})

describe('library extensions', () => {
  const extended = defineLibrary({
    name: 'ldml-plus',
    dialect: ldml,
    extends: [{ token: 'u', canonical: Canonical.EpochSeconds }],
  })

  it('converts an extension token to another library through its canonical', () => {
    expect(convert('u', { from: extended, to: dateFns })).toBe('t')
  })

  it('escapes an extension token as a literal when the target dialect lacks the field', () => {
    expect(convert('u', { from: extended, to: ldml })).toBe('\'u\'')
  })
})
