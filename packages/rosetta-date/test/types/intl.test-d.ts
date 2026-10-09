import type { FromIntlOptions, IntlUnsupportedPolicy, ToIntlOptions } from 'rosetta-date/intl'
import { fromIntlOptions, toIntlOptions } from 'rosetta-date/intl'
import { describe, expectTypeOf, it } from 'vitest'

describe('toIntlOptions', () => {
  it('takes a format and ToIntlOptions', () => {
    expectTypeOf(toIntlOptions).parameters.toEqualTypeOf<[string, ToIntlOptions]>()
  })

  it('returns Intl.DateTimeFormatOptions', () => {
    expectTypeOf(toIntlOptions).returns.toEqualTypeOf<Intl.DateTimeFormatOptions>()
  })
})

describe('fromIntlOptions', () => {
  it('takes Intl.DateTimeFormatOptions and FromIntlOptions', () => {
    expectTypeOf(fromIntlOptions).parameters.toEqualTypeOf<[Intl.DateTimeFormatOptions, FromIntlOptions]>()
  })

  it('returns a format string', () => {
    expectTypeOf(fromIntlOptions).returns.toEqualTypeOf<string>()
  })
})

describe('intl unsupported-token policy', () => {
  it('accepts only drop and throw', () => {
    expectTypeOf<IntlUnsupportedPolicy>().toEqualTypeOf<'throw' | 'drop'>()
  })

  it('rejects a handler', () => {
    // @ts-expect-error the Intl bridge takes no handler
    const policy: IntlUnsupportedPolicy = () => undefined
    expectTypeOf(policy).toEqualTypeOf<IntlUnsupportedPolicy>()
  })
})
