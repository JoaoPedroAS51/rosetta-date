import { describe, expect, it } from 'vitest'
import { moment } from '../dialects/moment'
import { unicode } from '../dialects/unicode'
import { parse } from './parse'
import { render } from './render'

const m2u = (input: string): string => render(parse(input, moment), unicode)
const u2m = (input: string): string => render(parse(input, unicode), moment)

describe('moment → unicode', () => {
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
    // moment has no `T` token; unicode `T` is the epoch token. Emitting a literal
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

describe('unicode → moment', () => {
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
