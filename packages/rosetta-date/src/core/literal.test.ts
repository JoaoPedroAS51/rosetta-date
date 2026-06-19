import type { LiteralRules } from './types'
import { describe, expect, it } from 'vitest'
import { escapeLiteral, isPatternChar, readLiteral } from './literal'

const bracket: LiteralRules = { open: '[', close: ']' }
const quoted: LiteralRules = { open: '\'', close: '\'', escapedDelimiter: '\'\'' }

describe('isPatternChar', () => {
  it('treats ASCII letters as pattern characters and the rest as literal', () => {
    expect(isPatternChar('a')).toBe(true)
    expect(isPatternChar('Z')).toBe(true)
    expect(isPatternChar('5')).toBe(false)
    expect(isPatternChar('/')).toBe(false)
  })
})

describe('readLiteral — bracketed', () => {
  it('reads text up to the closing bracket', () => {
    expect(readLiteral('[de] X', 0, bracket)).toEqual({ value: 'de', next: 4 })
  })

  it('reads an empty bracket pair', () => {
    expect(readLiteral('[]', 0, bracket)).toEqual({ value: '', next: 2 })
  })

  it('returns null for an unterminated bracket', () => {
    expect(readLiteral('[de', 0, bracket)).toBeNull()
  })

  it('returns null when not at an opener', () => {
    expect(readLiteral('de', 0, bracket)).toBeNull()
  })
})

describe('readLiteral — quoted', () => {
  it('reads text up to the closing quote', () => {
    expect(readLiteral('\'de\' x', 0, quoted)).toEqual({ value: 'de', next: 4 })
  })

  it('decodes a doubled quote inside a run', () => {
    expect(readLiteral('\'o\'\'clock\'', 0, quoted)).toEqual({ value: 'o\'clock', next: 10 })
  })

  it('decodes a doubled quote standing on its own', () => {
    expect(readLiteral('\'\'', 0, quoted)).toEqual({ value: '\'', next: 2 })
  })

  it('reads an unterminated run to the end of input', () => {
    expect(readLiteral('\'abc', 0, quoted)).toEqual({ value: 'abc', next: 4 })
  })

  it('returns null when not at an opener', () => {
    expect(readLiteral('de', 0, quoted)).toBeNull()
  })
})

describe('escapeLiteral', () => {
  it('returns an empty string unchanged', () => {
    expect(escapeLiteral('', bracket)).toBe('')
  })

  it('emits punctuation-only text raw', () => {
    expect(escapeLiteral('/', bracket)).toBe('/')
    expect(escapeLiteral(' - ', quoted)).toBe(' - ')
  })

  it('doubles a lone delimiter for quoted dialects', () => {
    expect(escapeLiteral('\'', quoted)).toBe('\'\'')
  })

  it('wraps only the letter span, leaving outer punctuation raw', () => {
    expect(escapeLiteral(' o\'clock', bracket)).toBe(' [o\'clock]')
    expect(escapeLiteral(' o\'clock', quoted)).toBe(' \'o\'\'clock\'')
  })

  it('wraps a letters-only literal', () => {
    expect(escapeLiteral('de', bracket)).toBe('[de]')
    expect(escapeLiteral('de', quoted)).toBe('\'de\'')
  })

  it('splits a bracketed span around the close delimiter it cannot escape', () => {
    // moment has no in-band escape for `]`, so a `]` inside the letter span is
    // emitted raw between bracketed pieces instead of being swallowed.
    expect(escapeLiteral('a]b', bracket)).toBe('[a]][b]')
    expect(escapeLiteral('a]]b', bracket)).toBe('[a]]][b]') // consecutive `]` → empty middle piece
    expect(escapeLiteral(']ab', bracket)).toBe('][ab]') // leading `]` stays in the raw lead
    expect(escapeLiteral('ab]', bracket)).toBe('[ab]]') // trailing `]` stays in the raw trail
  })
})
