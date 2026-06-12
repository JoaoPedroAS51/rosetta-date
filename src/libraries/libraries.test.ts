import { describe, expect, it } from 'vitest'
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
    // `Mo`/`Qo` are unsupported by Day.js but fine for the full moment grammar.
    expect(convert('Mo Qo', { from: ldml, to: momentjs })).toBe('Mo Qo')
  })
})

describe('target-capability awareness (the dayjs subset)', () => {
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
        from: ldml,
        to: dayjs,
        onUnsupportedToken: (_token, info) => {
          reason = info.reason
          return undefined
        },
      })
      return reason
    }

    // `i` (ISO weekday) maps to moment's `E`, which Day.js does not render.
    expect(reasonFor('i')).toBe('unsupported-by-target')
    // `MMMMM` (narrow month) has no token in the moment grammar at all.
    expect(reasonFor('MMMMM')).toBe('unmappable')
  })

  it('binds a library target through createConverter', () => {
    const safeForDayjs = createConverter(momentjs, dayjs, { onUnsupportedToken: 'throw' })
    expect(safeForDayjs('YYYY-MM-DD')).toBe('YYYY-MM-DD')
    expect(() => safeForDayjs('Mo')).toThrowError(UnsupportedTokenError)
  })
})

describe('defineLibrary validation', () => {
  it('rejects a supported token absent from the dialect', () => {
    expect(() => defineLibrary({ name: 'broken', dialect: moment, supports: new Set(['NOPE']) }))
      .toThrowError(/NOPE/)
  })

  it('accepts a subset whose tokens all exist in the dialect', () => {
    expect(() => defineLibrary({ name: 'ok', dialect: moment, supports: new Set(['YYYY', 'MM']) }))
      .not
      .toThrow()
  })
})

describe('getLibrary', () => {
  it('resolves a library by name for the dynamic, string-driven path', () => {
    expect(getLibrary('dayjs')).toBe(dayjs)
    expect(getLibrary('date-fns')).toBe(dateFns)
    expect(getLibrary('momentjs')).toBe(momentjs)
  })
})
