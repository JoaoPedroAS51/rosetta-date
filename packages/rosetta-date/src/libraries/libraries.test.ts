import type { UnsupportedTokenInfo } from '../index'
import { describe, expect, it } from 'vitest'
import { Canonical } from '../core/canonical'
import { renderedTokens } from '../core/render'
import { ldml, moment } from '../dialects'
import { convert, createConverter, defineLibrary, UnsupportedTokenError } from '../index'
import { dateFns, dayjs, getLibrary, momentjs } from './index'

// What each library renders (its `supports`/`extends`) is covered systematically by
// the endpoint conformance, matrix, round-trip, and totality suites in `test/`. The
// tests here cover the library-level *mechanics* the oracle cannot express.

describe('output spelling is a dialect concern, not a library choice', () => {
  it('renders an aliased field via the dialect primary spelling', () => {
    // `supports` gates which fields render, never how they are spelled: the
    // calendar year has moment aliases `YYYY` (primary) and `Y`, and a library
    // cannot select the alias.
    expect(renderedTokens(dayjs).get(Canonical.YearNumeric)).toBe('YYYY')
    expect(convert('Y', { from: momentjs, to: dayjs })).toBe('YYYY')
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

describe('unsupported-token reasons & policy for library targets', () => {
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
    expect(() => defineLibrary({ name: 'broken', dialect: moment, supports: new Set([Canonical.HourNumericH11]) }))
      .toThrowError(/h11/)
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

describe('getLibrary', () => {
  it('resolves a library by name for the dynamic, string-driven path', () => {
    expect(getLibrary('dayjs')).toBe(dayjs)
    expect(getLibrary('date-fns')).toBe(dateFns)
    expect(getLibrary('momentjs')).toBe(momentjs)
  })
})
