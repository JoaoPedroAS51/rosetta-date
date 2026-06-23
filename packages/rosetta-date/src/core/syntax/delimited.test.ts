import { describe, expect, it } from 'vitest'
import { Canonical } from '../canonical'
import { compile } from '../tokenize'
import { delimitedStrategy } from './delimited'

const bracket = delimitedStrategy({ kind: 'delimited', open: '[', close: ']' })
const quoted = delimitedStrategy({ kind: 'delimited', open: '\'', close: '\'', escapedDelimiter: '\'\'' })

const tokens = compile({
  name: 'sample',
  syntax: { kind: 'delimited', open: '[', close: ']' },
  tokens: [
    { token: 'YYYY', canonical: Canonical.YearNumeric },
    { token: 'YY', canonical: Canonical.YearTwoDigit },
    { token: 'M', canonical: Canonical.MonthNumeric },
  ],
})

const composites = [{ token: 'T', expandsTo: 'YYYY' }]

describe('delimited scan', () => {
  it('reads a bracketed literal run', () => {
    expect(bracket.scan('[de]X', 0, tokens, [])).toEqual({ kind: 'literal', value: 'de', next: 4 })
  })

  it('reads an empty bracket pair', () => {
    expect(bracket.scan('[]', 0, tokens, [])).toEqual({ kind: 'literal', value: '', next: 2 })
  })

  it('treats an unterminated bracket as a single literal character', () => {
    expect(bracket.scan('[de', 0, tokens, [])).toEqual({ kind: 'literal', value: '[', next: 1 })
  })

  it('reads a non-letter as a literal character', () => {
    expect(bracket.scan('/', 0, tokens, [])).toEqual({ kind: 'literal', value: '/', next: 1 })
  })

  it('matches the longest token at a letter position', () => {
    expect(bracket.scan('YYYY', 0, tokens, [])).toEqual({ kind: 'token', token: 'YYYY', canonical: Canonical.YearNumeric, next: 4 })
  })

  it('matches a composite spelling (generic over families)', () => {
    expect(bracket.scan('T', 0, tokens, composites)).toEqual({ kind: 'composite', token: 'T', expandsTo: 'YYYY', next: 1 })
  })

  it('treats an over-long run of a single-letter composite as one unknown', () => {
    expect(bracket.scan('TT', 0, tokens, composites)).toEqual({ kind: 'unknown', value: 'TT', next: 2 })
  })

  it('consumes an over-long same-letter run as one unknown', () => {
    expect(bracket.scan('YYYYY', 0, tokens, [])).toEqual({ kind: 'unknown', value: 'YYYYY', next: 5 })
  })

  it('reads a quoted run, decoding doubled quotes', () => {
    expect(quoted.scan('\'de\'', 0, tokens, [])).toEqual({ kind: 'literal', value: 'de', next: 4 })
    expect(quoted.scan('\'o\'\'clock\'', 0, tokens, [])).toEqual({ kind: 'literal', value: 'o\'clock', next: 10 })
  })

  it('decodes a doubled quote standing on its own', () => {
    expect(quoted.scan('\'\'', 0, tokens, [])).toEqual({ kind: 'literal', value: '\'', next: 2 })
  })

  it('reads an unterminated quoted run to the end of input', () => {
    expect(quoted.scan('\'abc', 0, tokens, [])).toEqual({ kind: 'literal', value: 'abc', next: 4 })
  })
})

describe('delimited escapeLiteral', () => {
  it('returns an empty string unchanged', () => {
    expect(bracket.escapeLiteral('')).toBe('')
  })

  it('emits punctuation-only text raw', () => {
    expect(bracket.escapeLiteral('/')).toBe('/')
    expect(quoted.escapeLiteral(' - ')).toBe(' - ')
  })

  it('doubles a lone delimiter for quoted dialects', () => {
    expect(quoted.escapeLiteral('\'')).toBe('\'\'')
  })

  it('wraps only the letter span, leaving outer punctuation raw', () => {
    expect(bracket.escapeLiteral(' o\'clock')).toBe(' [o\'clock]')
    expect(quoted.escapeLiteral(' o\'clock')).toBe(' \'o\'\'clock\'')
  })

  it('wraps a letters-only literal', () => {
    expect(bracket.escapeLiteral('de')).toBe('[de]')
    expect(quoted.escapeLiteral('de')).toBe('\'de\'')
  })

  it('splits a bracketed span around the close delimiter it cannot escape', () => {
    expect(bracket.escapeLiteral('a]b')).toBe('[a]][b]')
    expect(bracket.escapeLiteral('a]]b')).toBe('[a]]][b]')
    expect(bracket.escapeLiteral(']ab')).toBe('][ab]')
    expect(bracket.escapeLiteral('ab]')).toBe('[ab]]')
  })
})

describe('delimited separator', () => {
  it('returns empty when the two tokens do not re-merge', () => {
    expect(bracket.separator('YY', 'M', tokens)).toBe('')
  })

  it('returns the boundary literal when they would re-merge', () => {
    expect(bracket.separator('YY', 'YY', tokens)).toBe('[]')
  })

  it('returns undefined when a quoted dialect has no boundary', () => {
    expect(quoted.separator('YY', 'YY', tokens)).toBeUndefined()
  })
})
