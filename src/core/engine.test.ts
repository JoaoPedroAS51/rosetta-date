import { describe, expect, it } from 'vitest'
import { ldml } from '../dialects/ldml'
import { moment } from '../dialects/moment'
import { parse } from './parse'
import { render } from './render'

const m2u = (input: string): string => render(parse(input, moment), ldml)
const u2m = (input: string): string => render(parse(input, ldml), moment)

describe('moment → ldml', () => {
  it('converts common formats', () => {
    expect(m2u('DD/MM/YYYY')).toBe('dd/MM/yyyy')
    expect(m2u('YYYY-MM-DD HH:mm:ss')).toBe('yyyy-MM-dd HH:mm:ss')
  })

  it('resolves the capital-letter traps via the canonical model', () => {
    // moment YYYY is the calendar year → lowercase yyyy, never LDML week-year YYYY
    expect(m2u('YYYY')).toBe('yyyy')
    // moment DD is day-of-month → lowercase dd, never LDML day-of-year DD
    expect(m2u('DD')).toBe('dd')
  })

  it('preserves bracketed literals as quoted literals', () => {
    expect(m2u('[Year] YYYY')).toBe('\'Year\' yyyy')
    expect(m2u('DD [of] MMMM')).toBe('dd \'of\' MMMM')
  })

  it('literalizes a letter that is not a token, so it is not re-read as one', () => {
    // moment has no `T` token; ldml `T` is the epoch token. Emitting a literal
    // keeps the ISO separator from becoming a timestamp in date-fns.
    expect(m2u('YYYY-MM-DDTHH:mm:ss')).toBe('yyyy-MM-dd\'T\'HH:mm:ss')
  })

  it('drops an empty literal', () => {
    expect(m2u('[]')).toBe('')
  })

  it('literalizes a run of unrecognized letters', () => {
    // moment has no localized `L` token, so `LL` is unknown and becomes a literal.
    expect(m2u('LL')).toBe('\'LL\'')
  })
})

describe('unsupported same-letter runs and adjacent literals', () => {
  it('treats an over-long run as one unrecognized token, not several short ones', () => {
    // date-fns `QQQ` (abbreviated quarter) must not become moment `QQQ` (three
    // quarter numbers) — the run has no moment token, so it literalizes whole.
    expect(u2m('QQQ')).toBe('[QQQ]')
    // moment caps months at `MMMM`; `MMMMM` must not remap to wide + numeric.
    expect(m2u('MMMMM')).toBe('\'MMMMM\'')
  })

  it('coalesces adjacent unrecognized letters so no stray delimiter appears', () => {
    // `L` and `T` are both unknown to moment; escaping them separately would read
    // back as the apostrophe `L'T` instead of the literal `LT`.
    expect(m2u('LT')).toBe('\'LT\'')
  })
})

describe('ldml → moment', () => {
  it('converts common formats', () => {
    expect(u2m('dd/MM/yyyy')).toBe('DD/MM/YYYY')
    expect(u2m('yyyy-MM-dd HH:mm:ss')).toBe('YYYY-MM-DD HH:mm:ss')
  })

  it('decodes quoted literals and escaped apostrophes', () => {
    expect(u2m('h \'o\'\'clock\'')).toBe('h [o\'clock]')
  })
})

describe('round trips on the bijective core', () => {
  it.each([
    'DD/MM/YYYY',
    'YYYY-MM-DD[T]HH:mm:ss',
    'ddd, Do MMM YYYY',
    'h:mm A',
  ])('moment %s survives a round trip', (format) => {
    expect(u2m(m2u(format))).toBe(format)
  })
})
