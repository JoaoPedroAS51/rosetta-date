import type { CanonicalToken, DecodedCanonical } from 'rosetta-date'
import { Canonical, decodeCanonical } from 'rosetta-date'
import { describe, expectTypeOf, it } from 'vitest'

describe('canonical vocabulary', () => {
  it('types each member as its string literal', () => {
    expectTypeOf(Canonical.YearNumeric).toEqualTypeOf<'year/numeric'>()
  })

  it('types CanonicalToken as the union of the member values', () => {
    expectTypeOf<CanonicalToken>().toEqualTypeOf<(typeof Canonical)[keyof typeof Canonical]>()
  })

  it('excludes arbitrary strings from CanonicalToken', () => {
    expectTypeOf<'year/whatever'>().not.toExtend<CanonicalToken>()
  })
})

describe('decodeCanonical', () => {
  it('accepts a CanonicalToken and returns DecodedCanonical', () => {
    expectTypeOf(decodeCanonical).parameters.toEqualTypeOf<[CanonicalToken]>()
    expectTypeOf(decodeCanonical).returns.toEqualTypeOf<DecodedCanonical>()
  })
})
