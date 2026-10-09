import type { CanonicalToken, Dialect, TokenRule, TokenSyntax } from 'rosetta-date'
import type { DialectName } from 'rosetta-date/dialects'
import { defineDialect } from 'rosetta-date'
import { getDialect } from 'rosetta-date/dialects'
import { describe, expectTypeOf, it } from 'vitest'

describe('defineDialect', () => {
  it('returns a Dialect', () => {
    expectTypeOf(defineDialect).returns.toEqualTypeOf<Dialect>()
  })

  it('types a token rule canonical as CanonicalToken', () => {
    expectTypeOf<TokenRule['canonical']>().toEqualTypeOf<CanonicalToken>()
  })

  it('rejects a token rule with a string that is not a canonical', () => {
    // @ts-expect-error `canonical` must be a CanonicalToken
    const rule: TokenRule = { token: 'YYYY', canonical: 'year' }
    expectTypeOf(rule).toEqualTypeOf<TokenRule>()
  })

  it('requires a marker on a directive syntax', () => {
    // @ts-expect-error a directive syntax needs `marker`
    const syntax: TokenSyntax = { kind: 'directive' }
    expectTypeOf(syntax).toEqualTypeOf<TokenSyntax>()
  })

  it('requires open and close on a delimited syntax', () => {
    // @ts-expect-error a delimited syntax needs `close`
    const syntax: TokenSyntax = { kind: 'delimited', open: '[' }
    expectTypeOf(syntax).toEqualTypeOf<TokenSyntax>()
  })
})

describe('getDialect', () => {
  it('types DialectName as the built-in dialect names', () => {
    expectTypeOf<DialectName>().toEqualTypeOf<'moment' | 'ldml' | 'strftime'>()
  })

  it('rejects an unknown dialect name', () => {
    // @ts-expect-error not a built-in dialect
    expectTypeOf(getDialect).toBeCallableWith('unicode')
  })

  it('returns a Dialect', () => {
    expectTypeOf(getDialect).returns.toEqualTypeOf<Dialect>()
  })
})
