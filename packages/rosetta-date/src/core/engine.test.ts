import type { Dialect } from './types'
import { describe, expect, it } from 'vitest'
import { convert } from '../converter'
import { ldml } from '../dialects/ldml'
import { moment } from '../dialects/moment'
import { Canonical } from './canonical'
import { UnsupportedTokenError } from './errors'
import { parse } from './parse'
import { render, renderedTokens } from './render'

const m2u = (input: string): string => render(parse(input, moment), ldml)
const u2m = (input: string): string => render(parse(input, ldml), moment)

describe('moment → ldml', () => {
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

describe('tokenization and caching', () => {
  it('matches the longest token regardless of declaration order', () => {
    // `Y` is declared before `YYYY`; longest-match must still pick `YYYY`, not Y×4.
    const dialect: Dialect = {
      name: 'order',
      syntax: { kind: 'delimited', open: '[', close: ']' },
      tokens: [
        { token: 'Y', canonical: Canonical.YearTwoDigit },
        { token: 'YYYY', canonical: Canonical.YearNumeric },
      ],
    }
    expect(parse('YYYY', dialect)).toEqual([{ kind: 'field', canonical: Canonical.YearNumeric, raw: 'YYYY' }])
  })

  it('compiles a render target once and caches it by object identity', () => {
    expect(renderedTokens(moment)).toBe(renderedTokens(moment))
  })
})

describe('the pure ldml dialect excludes date-fns extensions', () => {
  // The localized presets, epoch, and ISO helpers are date-fns additions, not
  // UTS#35 — they live on the `dateFns` library, so the bare dialect lacks them.
  // The full extension conversions are covered by the endpoint suites in `test/`.
  it('does not recognize date-fns-only tokens', () => {
    expect(u2m('t')).toBe('[t]') // epoch
    expect(u2m('I')).toBe('[I]') // ISO week
    expect(u2m('P')).toBe('[P]') // localized preset
  })

  it('cannot express moment fields that only the date-fns library extends to', () => {
    // moment `X` (epoch) and `L` (localized) have no pure-LDML token → literalized.
    expect(m2u('X')).toBe('\'X\'')
    expect(m2u('L')).toBe('\'L\'')
  })
})

describe('ldml → moment', () => {
  it('decodes quoted literals and escaped apostrophes', () => {
    expect(u2m('h \'o\'\'clock\'')).toBe('h [o\'clock]')
  })

  it('keeps a literal `]` intact even though moment cannot escape it', () => {
    // The `]` lands between bracketed spans rather than being swallowed, so the
    // literal still round-trips through moment's escape-less bracket grammar.
    expect(u2m('\'a]b\'')).toBe('[a]][b]')
    expect(m2u('[a]][b]')).toBe('\'a]b\'')
  })
})

describe('malformed delimiters degrade to literal text, never throw', () => {
  it('reads an unterminated quote to end of input as a literal', () => {
    expect(u2m('\'abc')).toBe('[abc]')
  })

  it('treats an unterminated bracket open as a literal and keeps parsing', () => {
    // `[` cannot open a complete literal, so it is emitted as text; `Abc` parses on
    // (moment `A` is am/pm, `bc` is an unknown run) — the engine never throws.
    expect(m2u('[Abc')).toBe('[a\'bc\'')
  })
})

describe('unrepresentable adjacency (a quote-style target with no empty literal)', () => {
  // `bracket` parses `A`/`B` as two distinct tokens; `quote` renders them as
  // `y`/`yy`, which collide when adjacent (`yyy` re-reads as `yy`+`y`). `quote`
  // has no empty literal (`''` is an apostrophe), so the merge cannot be separated.
  const bracket: Dialect = {
    name: 'bracket',
    syntax: { kind: 'delimited', open: '[', close: ']' },
    tokens: [
      { token: 'A', canonical: Canonical.EpochSeconds },
      { token: 'B', canonical: Canonical.EpochMilliseconds },
    ],
  }
  const quote: Dialect = {
    name: 'quote',
    syntax: { kind: 'delimited', open: '\'', close: '\'', escapedDelimiter: '\'\'' },
    tokens: [
      { token: 'y', canonical: Canonical.EpochSeconds },
      { token: 'yy', canonical: Canonical.EpochMilliseconds },
    ],
  }

  it('literalizes the second token by default (no empty literal to insert)', () => {
    expect(convert('AB', { from: bracket, to: quote })).toBe('y\'yy\'') // y + literal yy
    expect(convert('BA', { from: bracket, to: quote })).toBe('yy\'y\'') // yy + literal y
  })

  it('throws unrepresentable-adjacency when asked to', () => {
    let error: unknown
    try {
      convert('AB', { from: bracket, to: quote, onUnsupportedToken: 'throw' })
    }
    catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(UnsupportedTokenError)
    expect((error as UnsupportedTokenError).reason).toBe('unrepresentable-adjacency')
    expect((error as UnsupportedTokenError).token).toBe('yy')
  })

  it('lets a handler decide, defaulting to a literal', () => {
    const reasons: string[] = []
    const out = convert('AB', {
      from: bracket,
      to: quote,
      onUnsupportedToken: (_token, info) => {
        reasons.push(info.reason)
        return undefined
      },
    })
    expect(out).toBe('y\'yy\'')
    expect(reasons).toEqual(['unrepresentable-adjacency'])
  })
})
