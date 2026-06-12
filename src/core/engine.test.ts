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
    // moment has no `J` token, so the whole run is unknown and becomes a literal.
    expect(m2u('JJJ')).toBe('\'JJJ\'')
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
    // `J` and `b` are both unknown to moment; escaping them separately would read
    // back as the apostrophe `J'b` instead of the literal `Jb`.
    expect(m2u('Jb')).toBe('\'Jb\'')
  })
})

describe('localized presets (mapped preset ↔ preset, locale-deferred)', () => {
  it('maps atomic date and time presets to their counterpart token', () => {
    expect(m2u('L')).toBe('P')
    expect(m2u('LL')).toBe('PPP')
    expect(m2u('LT')).toBe('p')
    expect(u2m('PP')).toBe('ll')
  })

  it('maps a compound date-time preset to a single counterpart token', () => {
    // Not expanded to a sequence: the token stays one locale-aware preset, so each
    // library applies its own locale connector ("at" / ", " / …) at format time.
    expect(m2u('LLL')).toBe('PPPppp')
    expect(u2m('PPPppp')).toBe('LLL')
  })

  it('literalizes an ldml-only preset that moment cannot express', () => {
    // Full date (with weekday) — no moment token, so it is non-round-trippable.
    expect(u2m('PPPP')).toBe('[PPPP]')
  })
})

describe('adjacent localized presets of mismatched width (garbage-in)', () => {
  // date-fns combines consecutive presets with the locale connector even at
  // mismatched widths (`PPPp` → "June 7th, 2024 at 3:04 PM"). moment only has
  // matched-width compounds (`lll`/`LLL`/`LLLL`), so the correct input is a matched
  // compound token or a separator; gluing different widths is "garbage in".
  it('is clean for matched-width compounds and separated presets', () => {
    expect(u2m('PPpp')).toBe('lll') // matched widths → one compound token
    expect(u2m('PPPppp')).toBe('LLL')
    expect(u2m('PP p')).toBe('ll LT') // a separator is preserved verbatim
  })

  it('is lossy when widths differ but the tokens do not merge', () => {
    // `PP`→`ll`, `p`→`LT`: structurally fine (`ll`+`LT` re-lexes back), but the
    // locale connector date-fns would add (`", "`) is dropped.
    expect(u2m('PPp')).toBe('llLT')
  })

  it('is garbage when the moment presets merge into a different token', () => {
    // `PPP`→`LL` and the time token starts with `L`, so `LL`+`LT` glues to `LLLT`,
    // which moment re-reads as `LLL` (date-time) + a stray `T`. Not supported.
    expect(u2m('PPPp')).toBe('LLLT')
    expect(u2m('PPPpp')).toBe('LLLTS')
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
