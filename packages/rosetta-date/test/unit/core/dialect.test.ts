import type { Dialect, TokenRule } from 'rosetta-date'
import { Canonical, convert, defineDialect } from 'rosetta-date'
import { ldml, moment, strftime } from 'rosetta-date/dialects'
import { describe, expect, it } from 'vitest'

const time: readonly TokenRule[] = [
  { token: '%H', canonical: Canonical.HourTwoDigitH23 },
  { token: '%M', canonical: Canonical.MinuteTwoDigit },
  { token: '%S', canonical: Canonical.SecondTwoDigit },
]

describe('defineDialect', () => {
  it('returns the object it receives', () => {
    const bracketed: Dialect = {
      name: 'bracketed',
      syntax: { kind: 'delimited', open: '[', close: ']' },
      tokens: [{ token: 'YYYY', canonical: Canonical.YearNumeric }],
    }
    expect(defineDialect(bracketed)).toBe(bracketed)
  })

  it.for<{ case: string, dialect: Dialect }>([
    {
      case: 'a quote-style dialect with an escapedDelimiter',
      dialect: {
        name: 'quoted',
        syntax: { kind: 'delimited', open: '\'', close: '\'', escapedDelimiter: '\'\'' },
        tokens: [{ token: 'yyyy', canonical: Canonical.YearNumeric }],
      },
    },
    {
      case: 'a directive dialect with a marker',
      dialect: {
        name: 'directive',
        syntax: { kind: 'directive', marker: '%' },
        tokens: [{ token: '%Y', canonical: Canonical.YearNumeric }],
      },
    },
    {
      case: 'several tokens for one canonical',
      dialect: {
        name: 'aliased',
        syntax: { kind: 'delimited', open: '[', close: ']' },
        tokens: [
          { token: 'Y', canonical: Canonical.YearNumeric },
          { token: 'YYYY', canonical: Canonical.YearNumeric },
        ],
      },
    },
    {
      case: 'a composite that expands to defined tokens',
      dialect: {
        name: 'with-composite',
        syntax: { kind: 'directive', marker: '%' },
        tokens: time,
        composites: [{ token: '%T', expandsTo: '%H:%M:%S' }],
      },
    },
    ...[moment, ldml, strftime].map(dialect => ({ case: `the built-in ${dialect.name} dialect`, dialect })),
  ])('accepts $case', ({ dialect }) => {
    expect(() => defineDialect(dialect)).not.toThrow()
  })

  it.for<{ case: string, dialect: Dialect, error: RegExp }>([
    {
      case: 'a token spelling listed twice',
      dialect: {
        name: 'dup',
        syntax: { kind: 'delimited', open: '[', close: ']' },
        tokens: [
          { token: 'YY', canonical: Canonical.YearTwoDigit },
          { token: 'YY', canonical: Canonical.YearNumeric },
        ],
      },
      error: /more than once/,
    },
    {
      case: 'an empty token',
      dialect: {
        name: 'empty-token',
        syntax: { kind: 'delimited', open: '[', close: ']' },
        tokens: [{ token: '', canonical: Canonical.YearNumeric }],
      },
      error: /empty token/,
    },
    {
      case: 'an empty directive marker',
      dialect: { name: 'no-marker', syntax: { kind: 'directive', marker: '' }, tokens: [] },
      error: /non-empty directive "marker"/,
    },
    {
      case: 'a directive token without the marker',
      dialect: {
        name: 'bare-directive',
        syntax: { kind: 'directive', marker: '%' },
        tokens: [{ token: 'Y', canonical: Canonical.YearNumeric }],
      },
      error: /must begin with the marker/,
    },
    {
      case: 'an unknown syntax kind',
      dialect: { name: 'mystery', syntax: { kind: 'mystery' } as unknown as Dialect['syntax'], tokens: [] },
      error: /Unhandled variant/,
    },
    {
      case: 'an empty open delimiter',
      dialect: { name: 'no-open', syntax: { kind: 'delimited', open: '', close: ']' }, tokens: [] },
      error: /non-empty/,
    },
    {
      case: 'an empty close delimiter',
      dialect: { name: 'no-close', syntax: { kind: 'delimited', open: '[', close: '' }, tokens: [] },
      error: /non-empty/,
    },
    {
      case: 'an escapedDelimiter on a bracketed dialect',
      dialect: { name: 'bad-escape', syntax: { kind: 'delimited', open: '[', close: ']', escapedDelimiter: ']]' }, tokens: [] },
      error: /quote-style/,
    },
    {
      case: 'identical open and close delimiters without an escapedDelimiter',
      dialect: { name: 'ambiguous', syntax: { kind: 'delimited', open: '|', close: '|' }, tokens: [] },
      error: /must differ/,
    },
    {
      case: 'an empty escapedDelimiter',
      dialect: { name: 'empty-escape', syntax: { kind: 'delimited', open: '\'', close: '\'', escapedDelimiter: '' }, tokens: [] },
      error: /empty "escapedDelimiter"/,
    },
    {
      case: 'a composite that collides with a token',
      dialect: {
        name: 'collide',
        syntax: { kind: 'directive', marker: '%' },
        tokens: time,
        composites: [{ token: '%H', expandsTo: '%H:%M' }],
      },
      error: /collides with a token/,
    },
    {
      case: 'a composite spelling listed twice',
      dialect: {
        name: 'dup-composite',
        syntax: { kind: 'directive', marker: '%' },
        tokens: time,
        composites: [
          { token: '%T', expandsTo: '%H:%M' },
          { token: '%T', expandsTo: '%H:%M:%S' },
        ],
      },
      error: /more than once/,
    },
    {
      case: 'a composite whose expansion has unrecognized tokens',
      dialect: {
        name: 'bad-expansion',
        syntax: { kind: 'directive', marker: '%' },
        tokens: time,
        composites: [{ token: '%T', expandsTo: '%H:%Q:%S' }],
      },
      error: /unrecognized tokens/,
    },
    {
      case: 'a composite with an empty expansion',
      dialect: {
        name: 'empty-expansion',
        syntax: { kind: 'directive', marker: '%' },
        tokens: time,
        composites: [{ token: '%T', expandsTo: '' }],
      },
      error: /empty expansion/,
    },
    {
      case: 'a directive composite without the marker',
      dialect: {
        name: 'bare-composite',
        syntax: { kind: 'directive', marker: '%' },
        tokens: time,
        composites: [{ token: 'T', expandsTo: '%H:%M:%S' }],
      },
      error: /must begin with the marker/,
    },
    {
      case: 'an empty composite token',
      dialect: {
        name: 'empty-composite',
        syntax: { kind: 'delimited', open: '[', close: ']' },
        tokens: [{ token: 'H', canonical: Canonical.HourTwoDigitH23 }],
        composites: [{ token: '', expandsTo: 'H' }],
      },
      error: /empty composite token/,
    },
  ])('rejects $case', ({ dialect, error }) => {
    expect(() => defineDialect(dialect)).toThrow(error)
  })
})

describe('custom dialects', () => {
  const custom = defineDialect({
    name: 'custom',
    syntax: { kind: 'delimited', open: '{', close: '}' },
    tokens: [
      { token: 'yr', canonical: Canonical.YearNumeric },
      { token: 'mo', canonical: Canonical.MonthTwoDigit },
      { token: 'dy', canonical: Canonical.DayOfMonthTwoDigit },
    ],
  })

  it('converts from a custom dialect into a built-in one', () => {
    expect(convert('yr-mo-dy', { from: custom, to: ldml })).toBe('yyyy-MM-dd')
  })

  it('converts from a built-in dialect into a custom one', () => {
    expect(convert('yyyy/MM/dd', { from: ldml, to: custom })).toBe('yr/mo/dy')
  })
})
