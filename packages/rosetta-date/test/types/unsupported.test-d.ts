import type { UnsupportedTokenError, UnsupportedTokenHandler, UnsupportedTokenInfo, UnsupportedTokenPolicy, UnsupportedTokenReason } from 'rosetta-date'
import { Unsupported } from 'rosetta-date'
import { describe, expectTypeOf, it } from 'vitest'

describe('unsupported-token policy', () => {
  it('accepts the named policies and a handler', () => {
    expectTypeOf<UnsupportedTokenPolicy>().toEqualTypeOf<'literalize' | 'throw' | UnsupportedTokenHandler>()
  })

  it('types UnsupportedTokenReason as the four reasons', () => {
    expectTypeOf<UnsupportedTokenReason>().toEqualTypeOf<'unrecognized' | 'unmappable' | 'unsupported-by-target' | 'unrepresentable-adjacency'>()
  })
})

describe('unsupported-token handler', () => {
  it('receives the token and its info', () => {
    expectTypeOf<UnsupportedTokenHandler>().parameters.toEqualTypeOf<[string, UnsupportedTokenInfo]>()
  })

  it('may return a string, a sentinel or undefined', () => {
    expectTypeOf<ReturnType<UnsupportedTokenHandler>>()
      .toEqualTypeOf<string | typeof Unsupported.drop | typeof Unsupported.literalize | undefined>()
  })

  it('rejects a handler returning a number', () => {
    // @ts-expect-error a handler cannot return a number
    const handler: UnsupportedTokenHandler = () => 0
    expectTypeOf(handler).toEqualTypeOf<UnsupportedTokenHandler>()
  })

  it('types the sentinels as distinct unique symbols', () => {
    expectTypeOf(Unsupported.drop).toBeSymbol()
    expectTypeOf(Unsupported.drop).not.toEqualTypeOf(Unsupported.literalize)
  })
})

describe('unsupported-token error', () => {
  it('extends Error', () => {
    expectTypeOf<UnsupportedTokenError>().toExtend<Error>()
  })

  it('exposes the token and reason', () => {
    expectTypeOf<UnsupportedTokenError['token']>().toEqualTypeOf<string>()
    expectTypeOf<UnsupportedTokenError['reason']>().toEqualTypeOf<UnsupportedTokenReason>()
  })
})
