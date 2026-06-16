import type { Dialect, LiteralRules, TokenRule } from './index'
import { describe, expect, it } from 'vitest'
import { ldml } from './dialects'
import { Canonical, convert, defineDialect, defineLibrary } from './index'
import { dateFns } from './libraries'

describe('canonical vocabulary as public extension API', () => {
  it('exposes the named symbols as their stable string identifiers', () => {
    expect(Canonical.YearNumeric).toBe('year/numeric')
    expect(Canonical.DayOfMonthTwoDigit).toBe('day-of-month/2-digit')
  })

  it('builds a custom dialect that converts against a built-in', () => {
    const literal: LiteralRules = { open: '{', close: '}' }
    const tokens: readonly TokenRule[] = [
      { token: 'yr', canonical: Canonical.YearNumeric },
      { token: 'mo', canonical: Canonical.MonthTwoDigit },
      { token: 'dy', canonical: Canonical.DayOfMonthTwoDigit },
    ]
    const custom: Dialect = defineDialect({ name: 'custom', literal, tokens })

    expect(convert('yr-mo-dy', { from: custom, to: ldml })).toBe('yyyy-MM-dd')
    expect(convert('yyyy/MM/dd', { from: ldml, to: custom })).toBe('yr/mo/dy')
  })

  it('bridges a custom extends token to a built-in via its canonical symbol', () => {
    const extended = defineLibrary({
      name: 'ldml-plus',
      dialect: ldml,
      extends: [{ token: 'u', canonical: Canonical.EpochSeconds }],
    })

    // `u` carries epoch-seconds, which date-fns spells `t`.
    expect(convert('u', { from: extended, to: dateFns })).toBe('t')
    // The bare ldml dialect has no epoch token, so it literalizes instead.
    expect(convert('u', { from: extended, to: ldml })).toBe('\'u\'')
  })
})
