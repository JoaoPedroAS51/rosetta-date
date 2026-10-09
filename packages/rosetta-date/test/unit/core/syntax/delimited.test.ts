import { Canonical } from 'rosetta-date'
import { describe, expect, it } from 'vitest'
import { delimitedStrategy } from '../../../../src/core/syntax/delimited'
import { compile } from '../../../../src/core/tokenize'

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

describe('scan', () => {
  it.for([
    { case: 'a bracketed literal run', input: '[de]X', expected: { kind: 'literal', value: 'de', next: 4 } },
    { case: 'an empty bracket pair', input: '[]', expected: { kind: 'literal', value: '', next: 2 } },
    { case: 'an unterminated bracket as one literal character', input: '[de', expected: { kind: 'literal', value: '[', next: 1 } },
    { case: 'a non-letter as a literal character', input: '/', expected: { kind: 'literal', value: '/', next: 1 } },
    { case: 'the longest token at a letter', input: 'YYYY', expected: { kind: 'token', token: 'YYYY', canonical: Canonical.YearNumeric, next: 4 } },
    { case: 'an over-long same-letter run as one unknown', input: 'YYYYY', expected: { kind: 'unknown', value: 'YYYYY', next: 5 } },
  ])('reads $case', ({ input, expected }) => {
    expect(bracket.scan(input, 0, tokens, [])).toEqual(expected)
  })

  it('reads a composite spelling', () => {
    expect(bracket.scan('T', 0, tokens, composites)).toEqual({ kind: 'composite', token: 'T', expandsTo: 'YYYY', next: 1 })
  })

  it('reads an over-long run of a single-letter composite as one unknown', () => {
    expect(bracket.scan('TT', 0, tokens, composites)).toEqual({ kind: 'unknown', value: 'TT', next: 2 })
  })

  it.for([
    { case: 'a quoted run', input: '\'de\'', expected: { kind: 'literal', value: 'de', next: 4 } },
    { case: 'a doubled quote inside a quoted run', input: '\'o\'\'clock\'', expected: { kind: 'literal', value: 'o\'clock', next: 10 } },
    { case: 'a doubled quote on its own', input: '\'\'', expected: { kind: 'literal', value: '\'', next: 2 } },
    { case: 'an unterminated quoted run to the end of input', input: '\'abc', expected: { kind: 'literal', value: 'abc', next: 4 } },
  ])('decodes $case', ({ input, expected }) => {
    expect(quoted.scan(input, 0, tokens, [])).toEqual(expected)
  })
})

describe('escapeLiteral', () => {
  it.for([
    { strategy: 'bracket', input: '', expected: '' },
    { strategy: 'bracket', input: '/', expected: '/' },
    { strategy: 'quoted', input: ' - ', expected: ' - ' },
  ] as const)('emits "$input" unchanged in $strategy', ({ strategy, input, expected }) => {
    expect({ bracket, quoted }[strategy].escapeLiteral(input)).toBe(expected)
  })

  it('doubles a lone quote', () => {
    expect(quoted.escapeLiteral('\'')).toBe('\'\'')
  })

  it.for([
    { strategy: 'bracket', input: 'de', expected: '[de]' },
    { strategy: 'quoted', input: 'de', expected: '\'de\'' },
    { strategy: 'bracket', input: ' o\'clock', expected: ' [o\'clock]' },
    { strategy: 'quoted', input: ' o\'clock', expected: ' \'o\'\'clock\'' },
  ] as const)('wraps only the letter span of "$input" in $strategy', ({ strategy, input, expected }) => {
    expect({ bracket, quoted }[strategy].escapeLiteral(input)).toBe(expected)
  })

  it.for([
    { input: 'a]b', expected: '[a]][b]' },
    { input: 'a]]b', expected: '[a]]][b]' },
    { input: ']ab', expected: '][ab]' },
    { input: 'ab]', expected: '[ab]]' },
  ])('splits the bracketed span around the `]` in "$input"', ({ input, expected }) => {
    expect(bracket.escapeLiteral(input)).toBe(expected)
  })
})

describe('separator', () => {
  it('returns an empty string when the two tokens do not merge', () => {
    expect(bracket.separator('YY', 'M', tokens)).toBe('')
  })

  it('returns an empty literal when the two tokens would merge', () => {
    expect(bracket.separator('YY', 'YY', tokens)).toBe('[]')
  })

  it('returns undefined when a quoted dialect has no empty literal', () => {
    expect(quoted.separator('YY', 'YY', tokens)).toBeUndefined()
  })
})
