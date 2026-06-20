import type { Dialect } from './types'
import { describe, expect, it } from 'vitest'
import { dialects } from '../dialects/registry'
import { Canonical } from './canonical'
import { defineDialect } from './dialect'

const bracketed: Dialect = {
  name: 'bracketed',
  syntax: { kind: 'delimited', open: '[', close: ']' },
  tokens: [{ token: 'YYYY', canonical: Canonical.YearNumeric }],
}

describe('defineDialect', () => {
  it('returns the same object it was given (stable identity for the cache)', () => {
    expect(defineDialect(bracketed)).toBe(bracketed)
  })

  it('accepts a quote-style dialect with an escapedDelimiter', () => {
    expect(() => defineDialect({
      name: 'quoted',
      syntax: { kind: 'delimited', open: '\'', close: '\'', escapedDelimiter: '\'\'' },
      tokens: [{ token: 'yyyy', canonical: Canonical.YearNumeric }],
    })).not.toThrow()
  })

  it('accepts a directive dialect with a marker', () => {
    expect(() => defineDialect({
      name: 'directive',
      syntax: { kind: 'directive', marker: '%' },
      tokens: [{ token: '%Y', canonical: Canonical.YearNumeric }],
    })).not.toThrow()
  })

  it('accepts aliases (several tokens sharing one canonical symbol)', () => {
    expect(() => defineDialect({
      name: 'aliased',
      syntax: { kind: 'delimited', open: '[', close: ']' },
      tokens: [
        { token: 'Y', canonical: Canonical.YearNumeric },
        { token: 'YYYY', canonical: Canonical.YearNumeric },
      ],
    })).not.toThrow()
  })

  it('rejects a token spelling listed twice', () => {
    expect(() => defineDialect({
      name: 'dup',
      syntax: { kind: 'delimited', open: '[', close: ']' },
      tokens: [
        { token: 'YY', canonical: Canonical.YearTwoDigit },
        { token: 'YY', canonical: Canonical.YearNumeric },
      ],
    })).toThrowError(/more than once/)
  })

  it('rejects an empty directive marker', () => {
    expect(() => defineDialect({
      name: 'no-marker',
      syntax: { kind: 'directive', marker: '' },
      tokens: [],
    })).toThrowError(/non-empty directive "marker"/)
  })

  it('rejects a directive token that does not begin with the marker', () => {
    expect(() => defineDialect({
      name: 'bare-directive',
      syntax: { kind: 'directive', marker: '%' },
      tokens: [{ token: 'Y', canonical: Canonical.YearNumeric }],
    })).toThrowError(/must begin with the marker/)
  })

  it('rejects an unhandled syntax kind (exhaustiveness guard)', () => {
    expect(() => defineDialect({
      name: 'mystery',
      syntax: { kind: 'mystery' } as unknown as Dialect['syntax'],
      tokens: [],
    })).toThrowError(/Unhandled variant/)
  })

  it('rejects an empty open delimiter', () => {
    expect(() => defineDialect({
      name: 'no-open',
      syntax: { kind: 'delimited', open: '', close: ']' },
      tokens: [],
    })).toThrowError(/non-empty/)
  })

  it('rejects an empty close delimiter', () => {
    expect(() => defineDialect({
      name: 'no-close',
      syntax: { kind: 'delimited', open: '[', close: '' },
      tokens: [],
    })).toThrowError(/non-empty/)
  })

  it('rejects an escapedDelimiter on a bracketed dialect', () => {
    expect(() => defineDialect({
      name: 'bad-escape',
      syntax: { kind: 'delimited', open: '[', close: ']', escapedDelimiter: ']]' },
      tokens: [],
    })).toThrowError(/quote-style/)
  })

  it('rejects matching open/close with no escapedDelimiter (bracketed dialect)', () => {
    expect(() => defineDialect({
      name: 'ambiguous',
      syntax: { kind: 'delimited', open: '|', close: '|' },
      tokens: [],
    })).toThrowError(/must differ/)
  })

  it('rejects an empty token', () => {
    expect(() => defineDialect({
      name: 'empty-token',
      syntax: { kind: 'delimited', open: '[', close: ']' },
      tokens: [{ token: '', canonical: Canonical.YearNumeric }],
    })).toThrowError(/empty token/)
  })

  it('rejects an empty escapedDelimiter on a quote-style dialect', () => {
    expect(() => defineDialect({
      name: 'empty-escape',
      syntax: { kind: 'delimited', open: '\'', close: '\'', escapedDelimiter: '' },
      tokens: [],
    })).toThrowError(/empty "escapedDelimiter"/)
  })
})

describe('built-in dialects', () => {
  it.each(Object.entries(dialects))('accepts the %s dialect', (_name, dialect) => {
    expect(() => defineDialect(dialect)).not.toThrow()
  })
})
