import { describe, expect, it } from 'vitest'
import { getDialect, ldml, moment } from './dialects'
import { convert, createConverter, Unsupported, UnsupportedTokenError } from './index'

describe('convert', () => {
  it('converts in both directions', () => {
    expect(convert('DD/MM/YYYY', { from: moment, to: ldml })).toBe('dd/MM/yyyy')
    expect(convert('yyyy-MM-dd', { from: ldml, to: moment })).toBe('YYYY-MM-DD')
  })

  it('is a no-op when from and to are the same dialect', () => {
    expect(convert('DD/MM/YYYY', { from: moment, to: moment })).toBe('DD/MM/YYYY')
  })
})

describe('createConverter', () => {
  it('binds a fixed direction and is reusable', () => {
    const toDateFns = createConverter(moment, ldml)
    expect(toDateFns('YYYY-MM-DD')).toBe('yyyy-MM-dd')
    expect(toDateFns('hh:mm A')).toBe('hh:mm a')
  })

  it('matches convert for the same direction', () => {
    const toMoment = createConverter(ldml, moment)
    expect(toMoment('dd/MM/yyyy')).toBe(convert('dd/MM/yyyy', { from: ldml, to: moment }))
  })
})

describe('getDialect', () => {
  it('resolves a dialect by name for the dynamic, string-driven path', () => {
    expect(getDialect('moment')).toBe(moment)
    expect(getDialect('ldml')).toBe(ldml)
  })
})

describe('onUnsupportedToken policy', () => {
  it('literalizes by default', () => {
    expect(convert('K', { from: ldml, to: moment })).toBe('[K]') // unmappable field
    expect(convert('JJJJ', { from: moment, to: ldml })).toBe('\'JJJJ\'') // unrecognized run
  })

  it('throws an UnsupportedTokenError carrying the token and reason', () => {
    let error: unknown
    try {
      convert('K', { from: ldml, to: moment, onUnsupportedToken: 'throw' })
    }
    catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(UnsupportedTokenError)
    expect((error as UnsupportedTokenError).token).toBe('K')
    expect((error as UnsupportedTokenError).reason).toBe('unmappable')

    expect(() => convert('JJJJ', { from: moment, to: ldml, onUnsupportedToken: 'throw' }))
      .toThrowError(UnsupportedTokenError)
  })

  it('emits a handler-returned string verbatim', () => {
    expect(convert('K', { from: ldml, to: moment, onUnsupportedToken: () => 'HH' })).toBe('HH')
  })

  it('drops the token via Unsupported.drop (or an empty string)', () => {
    // `K` (unmappable) is dropped, so the surrounding literals coalesce.
    expect(convert('\'x\'K\'y\'', { from: ldml, to: moment, onUnsupportedToken: () => Unsupported.drop })).toBe('[xy]')
    expect(convert('\'x\'K\'y\'', { from: ldml, to: moment, onUnsupportedToken: () => '' })).toBe('[xy]')
  })

  it('defers to the default via Unsupported.literalize (or undefined)', () => {
    expect(convert('K', { from: ldml, to: moment, onUnsupportedToken: () => Unsupported.literalize })).toBe('[K]')
    expect(convert('K', { from: ldml, to: moment, onUnsupportedToken: () => undefined })).toBe('[K]')
  })

  it('hands an adjacent unrecognized run to the handler as one token', () => {
    // `J` and `b` are both unknown to moment and adjacent, so they coalesce into
    // a single `unknown` — the handler fires once with `Jb`, matching how a
    // same-letter run like `JJ` already behaves. A separator keeps them apart.
    const tokens: string[] = []
    const record = (token: string): undefined => {
      tokens.push(token)
      return undefined
    }

    convert('Jb', { from: moment, to: ldml, onUnsupportedToken: record })
    convert('J-b', { from: moment, to: ldml, onUnsupportedToken: record })

    expect(tokens).toEqual(['Jb', 'J', 'b'])
  })

  it('passes the token, reason, and dialects to the handler', () => {
    const calls: Array<{ token: string, reason: string, from: boolean, to: boolean }> = []
    convert('J K', {
      from: ldml,
      to: moment,
      onUnsupportedToken: (token, info) => {
        calls.push({ token, reason: info.reason, from: info.from === ldml, to: info.to === moment })
        return undefined
      },
    })
    expect(calls).toEqual([
      { token: 'J', reason: 'unrecognized', from: true, to: true },
      { token: 'K', reason: 'unmappable', from: true, to: true },
    ])
  })

  it('applies a policy bound at converter creation', () => {
    const strict = createConverter(ldml, moment, { onUnsupportedToken: 'throw' })
    expect(() => strict('K')).toThrowError(UnsupportedTokenError)
    expect(strict('dd/MM/yyyy')).toBe('DD/MM/YYYY')
  })
})
