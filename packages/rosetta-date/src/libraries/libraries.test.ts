import type { UnsupportedTokenInfo } from '../index'
import { describe, expect, it } from 'vitest'
import { Canonical } from '../core/canonical'
import { renderedTokens } from '../core/render'
import { ldml, moment } from '../dialects'
import { convert, createConverter, defineLibrary, UnsupportedTokenError } from '../index'
import { dateFns, dayjs, getLibrary, momentjs } from './index'

describe('library as a conversion endpoint', () => {
  it('converts lib → lib like the underlying dialects', () => {
    expect(convert('DD/MM/YYYY', { from: momentjs, to: dateFns })).toBe('dd/MM/yyyy')
    expect(convert('yyyy-MM-dd', { from: dateFns, to: momentjs })).toBe('YYYY-MM-DD')
  })

  it('mixes a dialect on one side and a library on the other', () => {
    expect(convert('hh:mm A', { from: momentjs, to: ldml })).toBe('hh:mm a')
    expect(convert('dd/MM/yyyy', { from: ldml, to: momentjs })).toBe('DD/MM/YYYY')
  })

  it('a reference library omits `supports` and renders its whole dialect', () => {
    expect(momentjs.supports).toBeUndefined()
    expect(dateFns.supports).toBeUndefined()
    // `Mo`/`Qo` are date-fns ordinal extensions, fine for the full moment grammar.
    expect(convert('Mo Qo', { from: dateFns, to: momentjs })).toBe('Mo Qo')
  })

  it('renders localized presets to Day.js (its LocalizedFormat tokens)', () => {
    // `localizedFormat` is in dayjs.supports, so these map cleanly rather than
    // being flagged. The compound `PPPppp` stays one token (`LLL`), not a sequence.
    expect(convert('PPP', { from: dateFns, to: dayjs })).toBe('LL')
    expect(convert('PPPppp', { from: dateFns, to: dayjs })).toBe('LLL')
    expect(convert('LLL', { from: momentjs, to: dayjs })).toBe('LLL')
  })
})

describe('date-fns extensions (tokens the dateFns library adds to ldml)', () => {
  // Not UTS#35 — they live on the dateFns library via `extends`, so they convert
  // through the *library*, while the bare `ldml` dialect lacks them entirely.
  it('converts the ISO / epoch extensions momentjs ↔ dateFns', () => {
    expect(convert('GGGG', { from: momentjs, to: dateFns })).toBe('RRRR') // ISO week-year
    expect(convert('W', { from: momentjs, to: dateFns })).toBe('I') // ISO week
    expect(convert('E', { from: momentjs, to: dateFns })).toBe('i') // ISO weekday
    expect(convert('X', { from: momentjs, to: dateFns })).toBe('t') // epoch seconds
    expect(convert('x', { from: momentjs, to: dateFns })).toBe('T') // epoch ms
    expect(convert('RRRR', { from: dateFns, to: momentjs })).toBe('GGGG')
    expect(convert('I', { from: dateFns, to: momentjs })).toBe('W')
    expect(convert('t', { from: dateFns, to: momentjs })).toBe('X')
  })

  it('converts the ordinal `…o` extensions momentjs ↔ dateFns', () => {
    expect(convert('Qo Mo wo Do', { from: momentjs, to: dateFns })).toBe('Qo Mo wo do')
    expect(convert('Wo', { from: momentjs, to: dateFns })).toBe('Io') // ISO week ordinal
    expect(convert('DDDo', { from: momentjs, to: dateFns })).toBe('Do') // day-of-year ordinal
    expect(convert('Qo Mo wo do Do Io', { from: dateFns, to: momentjs })).toBe('Qo Mo wo Do DDDo Wo')
  })

  it('converts localized presets preset ↔ preset (locale stays deferred)', () => {
    expect(convert('L', { from: momentjs, to: dateFns })).toBe('P')
    expect(convert('LLL', { from: momentjs, to: dateFns })).toBe('PPPppp') // compound = one token
    expect(convert('LLLL', { from: momentjs, to: dateFns })).toBe('PPPPpppp')
    expect(convert('PPPppp', { from: dateFns, to: momentjs })).toBe('LLL')
  })

  it('round-trips an extension format through both libraries', () => {
    const fmt = 'RRRR-II-i t'
    const toMoment = convert(fmt, { from: dateFns, to: momentjs })
    expect(convert(toMoment, { from: momentjs, to: dateFns })).toBe(fmt)
  })

  it('literalizes a dateFns-only slot the target tool lacks', () => {
    // Full date / tz-time / short date-time presets have no moment counterpart.
    expect(convert('PPPP', { from: dateFns, to: momentjs })).toBe('[PPPP]')
    expect(convert('ppp', { from: dateFns, to: momentjs })).toBe('[ppp]')
    expect(convert('Pp', { from: dateFns, to: momentjs })).toBe('[Pp]')
  })

  it('extends only through the library — the bare ldml dialect drops them', () => {
    expect(convert('X', { from: momentjs, to: dateFns })).toBe('t') // library has epoch
    expect(convert('X', { from: momentjs, to: ldml })).toBe('\'X\'') // pure dialect does not
  })
})

describe('mismatched-width localized presets (via dateFns)', () => {
  const d2m = (format: string): string => convert(format, { from: dateFns, to: momentjs })

  it('is clean for matched-width compounds and separated presets', () => {
    expect(d2m('PPpp')).toBe('lll')
    expect(d2m('PPPppp')).toBe('LLL')
    expect(d2m('PP p')).toBe('ll LT')
  })

  it('is lossy when widths differ but the tokens do not merge', () => {
    expect(d2m('PPp')).toBe('llLT') // `ll`+`LT` re-reads cleanly; only the locale connector is lost
  })

  it('separates presets that would otherwise merge into a different token', () => {
    // `LL`+`LT` would read back as `LLL`+`T`; the empty literal `[]` keeps them apart.
    expect(d2m('PPPp')).toBe('LL[]LT')
    expect(d2m('PPPpp')).toBe('LL[]LTS')
  })

  it('round-trips the separated form back to date-fns', () => {
    expect(convert(d2m('PPPp'), { from: momentjs, to: dateFns })).toBe('PPPp')
    expect(convert(d2m('PPPpp'), { from: momentjs, to: dateFns })).toBe('PPPpp')
  })
})

describe('target-support awareness (the dayjs subset)', () => {
  it('renders a supported token identically to the bare dialect', () => {
    expect(convert('YYYY-MM-DD', { from: momentjs, to: dayjs })).toBe('YYYY-MM-DD')
    expect(convert('Do MMMM', { from: momentjs, to: dayjs })).toBe('Do MMMM')
  })

  it('routes a token Day.js cannot render through the unsupported policy', () => {
    // Day.js would mangle `Mo` → `6o`; by default it literalizes instead.
    expect(convert('Mo', { from: momentjs, to: dayjs })).toBe('[Mo]')
  })

  it('reports the unsupported-by-target reason and token', () => {
    let error: unknown
    try {
      convert('Mo', { from: momentjs, to: dayjs, onUnsupportedToken: 'throw' })
    }
    catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(UnsupportedTokenError)
    expect((error as UnsupportedTokenError).reason).toBe('unsupported-by-target')
    expect((error as UnsupportedTokenError).token).toBe('Mo')
  })

  it('distinguishes "library cannot" from "grammar cannot"', () => {
    const reasonFor = (format: string): string | undefined => {
      let reason: string | undefined
      convert(format, {
        from: dateFns,
        to: dayjs,
        onUnsupportedToken: (_token, info) => {
          reason = info.reason
          return undefined
        },
      })
      return reason
    }

    // `Mo` (month ordinal) maps to moment's `Mo`, which Day.js does not render.
    expect(reasonFor('Mo')).toBe('unsupported-by-target')
    // `MMMMM` (narrow month) has no token in the moment grammar at all.
    expect(reasonFor('MMMMM')).toBe('unmappable')
  })

  it('binds a library target through createConverter', () => {
    const safeForDayjs = createConverter(momentjs, dayjs, { onUnsupportedToken: 'throw' })
    expect(safeForDayjs('YYYY-MM-DD')).toBe('YYYY-MM-DD')
    expect(() => safeForDayjs('Mo')).toThrowError(UnsupportedTokenError)
  })
})

describe('handler library context (fromLibrary / toLibrary)', () => {
  it('exposes both endpoints when they are libraries', () => {
    let info: UnsupportedTokenInfo | undefined
    // `PPPP` (full localized date) has no token in the moment grammar.
    convert('PPPP', {
      from: dateFns,
      to: momentjs,
      onUnsupportedToken: (_token, i) => {
        info = i
        return undefined
      },
    })
    expect(info?.fromLibrary).toBe(dateFns)
    expect(info?.toLibrary).toBe(momentjs)
    // `to` still resolves to the underlying dialect, as documented.
    expect(info?.to).toBe(moment)
  })

  it('identifies the target library when libraries share a dialect', () => {
    let lib: unknown
    // `Mo` is unsupported by Day.js (it would mangle to `6o`); the shared `moment`
    // dialect cannot tell dayjs from momentjs, but `toLibrary` can.
    convert('Mo', {
      from: momentjs,
      to: dayjs,
      onUnsupportedToken: (_token, i) => {
        lib = i.toLibrary
        return undefined
      },
    })
    expect(lib).toBe(dayjs)
  })

  it('leaves the context undefined for a bare dialect endpoint', () => {
    let info: UnsupportedTokenInfo | undefined
    convert('K', {
      from: ldml,
      to: moment,
      onUnsupportedToken: (_token, i) => {
        info = i
        return undefined
      },
    })
    expect(info?.fromLibrary).toBeUndefined()
    expect(info?.toLibrary).toBeUndefined()
  })
})

describe('defineLibrary validation', () => {
  it('rejects a supported canonical the dialect cannot express', () => {
    expect(() => defineLibrary({ name: 'broken', dialect: moment, supports: new Set([Canonical.Hour11Numeric]) }))
      .toThrowError(/hour-11/)
  })

  it('accepts a subset whose canonicals the dialect all expresses', () => {
    expect(() => defineLibrary({ name: 'ok', dialect: moment, supports: new Set([Canonical.YearNumeric, Canonical.MonthTwoDigit]) }))
      .not
      .toThrow()
  })

  it('rejects an extension token that collides with a dialect token', () => {
    expect(() => defineLibrary({ name: 'bad', dialect: ldml, extends: [{ token: 'M', canonical: Canonical.EpochSeconds }] }))
      .toThrowError(/already defines/)
  })

  it('rejects a token listed twice in extends', () => {
    expect(() => defineLibrary({
      name: 'dup',
      dialect: ldml,
      extends: [
        { token: 'tt', canonical: Canonical.EpochSeconds },
        { token: 'tt', canonical: Canonical.EpochMilliseconds },
      ],
    })).toThrowError(/more than once/)
  })

  it('accepts a supports set that includes an extension canonical', () => {
    expect(() => defineLibrary({
      name: 'ext-subset',
      dialect: ldml,
      extends: [{ token: 'tt', canonical: Canonical.EpochSeconds }],
      supports: new Set([Canonical.MonthNumeric, Canonical.EpochSeconds]),
    })).not.toThrow()
  })
})

describe('supports is total (the rendered set matches the declared subset)', () => {
  it('renders exactly the canonicals dayjs declares in `supports`', () => {
    expect(new Set(renderedTokens(dayjs).keys())).toEqual(dayjs.supports)
  })

  it('a reference library renders every canonical its grammar expresses', () => {
    const grammar = new Set(dateFns.resolved.dialect.tokens.map(rule => rule.canonical))
    expect(new Set(renderedTokens(dateFns).keys())).toEqual(grammar)
  })

  it('renders an aliased field via the dialect primary spelling, not a library choice', () => {
    // `supports` gates which fields render, never how they are spelled: am/pm has
    // moment aliases `A` (primary) and `a`, and a library cannot select the alias.
    expect(renderedTokens(dayjs).get(Canonical.DayPeriodAbbreviated)).toBe('A')
    expect(convert('a', { from: momentjs, to: dayjs })).toBe('A')
  })
})

describe('getLibrary', () => {
  it('resolves a library by name for the dynamic, string-driven path', () => {
    expect(getLibrary('dayjs')).toBe(dayjs)
    expect(getLibrary('date-fns')).toBe(dateFns)
    expect(getLibrary('momentjs')).toBe(momentjs)
  })
})

describe('plugin-gated tokens render unconditionally', () => {
  it('emits tokens a library renders only under a plugin/option/env, unflagged', () => {
    // `supports` lists what a library can render with its common plugins; the
    // converter does not model whether the consumer enabled them — the target
    // library signals that itself at format time.
    expect(convert('Q L', { from: momentjs, to: dayjs })).toBe('Q L') // AdvancedFormat + LocalizedFormat
    expect(convert('gggg', { from: momentjs, to: dateFns })).toBe('YYYY') // useAdditionalWeekYearTokens
    expect(convert('z', { from: momentjs, to: momentjs })).toBe('z') // moment-timezone
  })
})
