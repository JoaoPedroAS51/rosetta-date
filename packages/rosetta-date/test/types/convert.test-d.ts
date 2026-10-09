import type { Converter, ConverterOptions, Dialect, Library } from 'rosetta-date'
import { convert, createConverter } from 'rosetta-date'
import { moment } from 'rosetta-date/dialects'
import { describe, expectTypeOf, it } from 'vitest'

describe('convert', () => {
  it('accepts a dialect or a library on each side', () => {
    expectTypeOf(convert).parameter(1).toHaveProperty('from').toEqualTypeOf<Dialect | Library>()
    expectTypeOf(convert).parameter(1).toHaveProperty('to').toEqualTypeOf<Dialect | Library>()
  })

  it('returns a string', () => {
    expectTypeOf(convert).returns.toEqualTypeOf<string>()
  })

  it('rejects an endpoint name in place of an endpoint', () => {
    // @ts-expect-error endpoints are objects, not names
    expectTypeOf(convert).toBeCallableWith('YYYY', { from: 'moment', to: moment })
  })
})

describe('createConverter', () => {
  it('takes the endpoints and optional converter options', () => {
    expectTypeOf(createConverter).parameter(0).toEqualTypeOf<Dialect | Library>()
    expectTypeOf(createConverter).parameter(1).toEqualTypeOf<Dialect | Library>()
    expectTypeOf(createConverter).parameter(2).toEqualTypeOf<ConverterOptions | undefined>()
  })

  it('returns a Converter from string to string', () => {
    expectTypeOf(createConverter).returns.toEqualTypeOf<Converter>()
    expectTypeOf<Converter>().toEqualTypeOf<(format: string) => string>()
  })
})
