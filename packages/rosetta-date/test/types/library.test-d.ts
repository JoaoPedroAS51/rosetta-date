import type { CanonicalToken, Dialect, Library, LibraryDefinition } from 'rosetta-date'
import type { LibraryName } from 'rosetta-date/libraries'
import { defineLibrary } from 'rosetta-date'
import { getLibrary } from 'rosetta-date/libraries'
import { describe, expectTypeOf, it } from 'vitest'

describe('defineLibrary', () => {
  it('takes a LibraryDefinition and returns a Library', () => {
    expectTypeOf(defineLibrary).parameters.toEqualTypeOf<[LibraryDefinition]>()
    expectTypeOf(defineLibrary).returns.toEqualTypeOf<Library>()
  })

  it('types supports as an optional set of canonicals', () => {
    expectTypeOf<Library['supports']>().toEqualTypeOf<ReadonlySet<CanonicalToken> | undefined>()
  })

  it('exposes the resolved grammar and render predicate', () => {
    expectTypeOf<Library['resolved']['dialect']>().toEqualTypeOf<Dialect>()
    expectTypeOf<Library['resolved']['renders']>().toEqualTypeOf<(canonical: CanonicalToken) => boolean>()
  })

  it('requires a base dialect', () => {
    // @ts-expect-error `dialect` is required
    const definition: LibraryDefinition = { name: 'no-dialect' }
    expectTypeOf(definition).toEqualTypeOf<LibraryDefinition>()
  })
})

describe('getLibrary', () => {
  it('types LibraryName as the built-in library names', () => {
    expectTypeOf<LibraryName>().toEqualTypeOf<'momentjs' | 'dayjs' | 'date-fns'>()
  })

  it('rejects an unknown library name', () => {
    // @ts-expect-error not a built-in library
    expectTypeOf(getLibrary).toBeCallableWith('luxon')
  })

  it('returns a Library', () => {
    expectTypeOf(getLibrary).returns.toEqualTypeOf<Library>()
  })
})
