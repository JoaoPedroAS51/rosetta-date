import type { ConvertOptions, Dialect, UnsupportedTokenInfo } from 'rosetta-date'
import { Canonical, convert, createConverter, Unsupported } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'
import { dateFns, dayjs, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'
import { unsupportedError } from '../fixtures/errors'

function recordInfo(format: string, options: Pick<ConvertOptions, 'from' | 'to'>): Array<[string, UnsupportedTokenInfo]> {
  const calls: Array<[string, UnsupportedTokenInfo]> = []
  convert(format, {
    ...options,
    onUnsupportedToken: (token, info) => {
      calls.push([token, info])
      return undefined
    },
  })
  return calls
}

describe('default policy', () => {
  it.for([
    { reason: 'unmappable', format: 'K', from: ldml, to: moment, expected: '[K]' },
    { reason: 'unrecognized', format: 'JJJJ', from: moment, to: ldml, expected: '\'JJJJ\'' },
  ])('escapes an $reason token as a literal', ({ format, from, to, expected }) => {
    expect(convert(format, { from, to })).toBe(expected)
  })
})

describe('throw policy', () => {
  it.for([
    { reason: 'unmappable', format: 'K', from: ldml, to: moment },
    { reason: 'unrecognized', format: 'JJJJ', from: moment, to: ldml },
    { reason: 'unsupported-by-target', format: 'Mo', from: momentjs, to: dayjs },
  ] as const)('throws UnsupportedTokenError for an $reason token', ({ reason, format, from, to }) => {
    expect(() => convert(format, { from, to, onUnsupportedToken: 'throw' })).toThrow(unsupportedError(format, reason))
  })

  it('applies a policy bound by createConverter', () => {
    const strict = createConverter(ldml, moment, { onUnsupportedToken: 'throw' })
    expect(() => strict('K')).toThrow(unsupportedError('K', 'unmappable'))
  })

  it('rejects a token unsupported by the bound library target', () => {
    const strict = createConverter(momentjs, dayjs, { onUnsupportedToken: 'throw' })
    expect(() => strict('Mo')).toThrow(unsupportedError('Mo', 'unsupported-by-target'))
  })

  it('remains usable after a conversion throws', () => {
    const strict = createConverter(ldml, moment, { onUnsupportedToken: 'throw' })
    expect(() => strict('K')).toThrow(unsupportedError('K', 'unmappable'))
    expect(strict('yyyy-MM-dd')).toBe('YYYY-MM-DD')
  })

  it('converts supported tokens under a bound throw policy', () => {
    const strict = createConverter(momentjs, dayjs, { onUnsupportedToken: 'throw' })
    expect(strict('YYYY-MM-DD')).toBe('YYYY-MM-DD')
  })
})

describe('handler policy', () => {
  it('emits the returned string in place of the token', () => {
    expect(convert('K', { from: ldml, to: moment, onUnsupportedToken: () => 'HH' })).toBe('HH')
  })

  // Dropping `K` lets the literals around it merge into one span.
  it.for([
    { result: 'Unsupported.drop', value: Unsupported.drop },
    { result: 'an empty string', value: '' },
  ] as const)('drops the token when the handler returns $result', ({ value }) => {
    expect(convert('\'x\'K\'y\'', { from: ldml, to: moment, onUnsupportedToken: () => value })).toBe('[xy]')
  })

  it.for([
    { result: 'Unsupported.literalize', value: Unsupported.literalize },
    { result: 'undefined', value: undefined },
  ] as const)('escapes the token as a literal when the handler returns $result', ({ value }) => {
    expect(convert('K', { from: ldml, to: moment, onUnsupportedToken: () => value })).toBe('[K]')
  })

  it('receives adjacent unrecognized letters as one token', () => {
    expect(recordInfo('Jb', { from: moment, to: ldml }).map(([token]) => token)).toEqual(['Jb'])
  })

  it('receives unrecognized letters separated by a literal as separate tokens', () => {
    expect(recordInfo('J-b', { from: moment, to: ldml }).map(([token]) => token)).toEqual(['J', 'b'])
  })

  it('receives the token, reason and both dialects', () => {
    const calls = recordInfo('J K', { from: ldml, to: moment })
    expect(calls).toEqual([
      ['J', expect.objectContaining({ reason: 'unrecognized', from: ldml, to: moment })],
      ['K', expect.objectContaining({ reason: 'unmappable', from: ldml, to: moment })],
    ])
    for (const [, info] of calls) {
      expect(info.from).toBe(ldml)
      expect(info.to).toBe(moment)
    }
  })
})

describe('library endpoints', () => {
  // `Mo` exists in the moment grammar but Day.js does not render it; `MMMMM` has no moment token at all.
  it.for([
    { format: 'Mo', reason: 'unsupported-by-target' },
    { format: 'MMMMM', reason: 'unmappable' },
  ])('reports "$format" as $reason', ({ format, reason }) => {
    expect(recordInfo(format, { from: dateFns, to: dayjs })).toEqual([[expect.any(String), expect.objectContaining({ reason })]])
  })

  it('passes both libraries to the handler', () => {
    const [[, info] = []] = recordInfo('PPPP', { from: dateFns, to: momentjs })
    expect(info?.fromLibrary).toBe(dateFns)
    expect(info?.toLibrary).toBe(momentjs)
  })

  it('passes the library dialect as `to`', () => {
    const [[, info] = []] = recordInfo('PPPP', { from: dateFns, to: momentjs })
    expect(info?.to).toBe(moment)
  })

  it('identifies the target library when two libraries share a dialect', () => {
    const [[, info] = []] = recordInfo('Mo', { from: momentjs, to: dayjs })
    expect(info?.toLibrary).toBe(dayjs)
  })

  it('leaves the library context undefined for dialect endpoints', () => {
    const [[, info] = []] = recordInfo('K', { from: ldml, to: moment })
    expect(info).toMatchObject({ fromLibrary: undefined, toLibrary: undefined })
  })
})

describe('unrepresentable adjacency', () => {
  // `bracket` reads `A` and `B` as two tokens. `quote` spells them `y` and `yy`, which merge when
  // adjacent, and `''` is an apostrophe in `quote`, so no empty literal can separate them.
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

  it.for([
    { format: 'AB', expected: 'y\'yy\'' },
    { format: 'BA', expected: 'yy\'y\'' },
  ])('escapes the second token of "$format" as a literal by default', ({ format, expected }) => {
    expect(convert(format, { from: bracket, to: quote })).toBe(expected)
  })

  it('throws with the unrepresentable-adjacency reason', () => {
    expect(() => convert('AB', { from: bracket, to: quote, onUnsupportedToken: 'throw' }))
      .toThrow(unsupportedError('yy', 'unrepresentable-adjacency'))
  })

  it('literalizes the adjacent token when the handler returns undefined', () => {
    expect(convert('AB', { from: bracket, to: quote, onUnsupportedToken: () => undefined })).toBe('y\'yy\'')
  })

  it('passes the unrepresentable-adjacency reason to the handler', () => {
    expect(recordInfo('AB', { from: bracket, to: quote })).toEqual([
      ['yy', expect.objectContaining({ reason: 'unrepresentable-adjacency' })],
    ])
  })
})
