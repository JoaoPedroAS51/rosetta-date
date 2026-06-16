import type { Dialect } from './types'
import { describe, expect, it } from 'vitest'
import { dialects } from '../dialects/registry'
import { Canonical } from './canonical'
import { defineDialect } from './dialect'

const bracketed: Dialect = {
  name: 'bracketed',
  literal: { open: '[', close: ']' },
  tokens: [{ token: 'YYYY', canonical: Canonical.YearNumeric }],
}

describe('defineDialect', () => {
  it('returns the same object it was given (stable identity for the cache)', () => {
    expect(defineDialect(bracketed)).toBe(bracketed)
  })

  it('accepts a quote-style dialect with an escapedDelimiter', () => {
    expect(() => defineDialect({
      name: 'quoted',
      literal: { open: '\'', close: '\'', escapedDelimiter: '\'\'' },
      tokens: [{ token: 'yyyy', canonical: Canonical.YearNumeric }],
    })).not.toThrow()
  })

  it('accepts aliases (several tokens sharing one canonical symbol)', () => {
    expect(() => defineDialect({
      name: 'aliased',
      literal: { open: '[', close: ']' },
      tokens: [
        { token: 'Y', canonical: Canonical.YearNumeric },
        { token: 'YYYY', canonical: Canonical.YearNumeric },
      ],
    })).not.toThrow()
  })

  it('rejects a token spelling listed twice', () => {
    expect(() => defineDialect({
      name: 'dup',
      literal: { open: '[', close: ']' },
      tokens: [
        { token: 'YY', canonical: Canonical.YearTwoDigit },
        { token: 'YY', canonical: Canonical.YearNumeric },
      ],
    })).toThrowError(/more than once/)
  })

  it('rejects an empty open delimiter', () => {
    expect(() => defineDialect({
      name: 'no-open',
      literal: { open: '', close: ']' },
      tokens: [],
    })).toThrowError(/non-empty/)
  })

  it('rejects an empty close delimiter', () => {
    expect(() => defineDialect({
      name: 'no-close',
      literal: { open: '[', close: '' },
      tokens: [],
    })).toThrowError(/non-empty/)
  })

  it('rejects an escapedDelimiter on a bracketed dialect', () => {
    expect(() => defineDialect({
      name: 'bad-escape',
      literal: { open: '[', close: ']', escapedDelimiter: ']]' },
      tokens: [],
    })).toThrowError(/quote-style/)
  })

  it('rejects matching open/close with no escapedDelimiter (bracketed dialect)', () => {
    expect(() => defineDialect({
      name: 'ambiguous',
      literal: { open: '|', close: '|' },
      tokens: [],
    })).toThrowError(/must differ/)
  })

  it('rejects an empty token', () => {
    expect(() => defineDialect({
      name: 'empty-token',
      literal: { open: '[', close: ']' },
      tokens: [{ token: '', canonical: Canonical.YearNumeric }],
    })).toThrowError(/empty token/)
  })

  it('rejects an empty escapedDelimiter on a quote-style dialect', () => {
    expect(() => defineDialect({
      name: 'empty-escape',
      literal: { open: '\'', close: '\'', escapedDelimiter: '' },
      tokens: [],
    })).toThrowError(/empty "escapedDelimiter"/)
  })
})

describe('built-in dialects', () => {
  it.each(Object.entries(dialects))('accepts the %s dialect', (_name, dialect) => {
    expect(() => defineDialect(dialect)).not.toThrow()
  })
})
