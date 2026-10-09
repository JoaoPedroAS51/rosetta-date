import { convert } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'
import { describe, expect, it } from 'vitest'

function momentToLdml(format: string): string {
  return convert(format, { from: moment, to: ldml })
}

function ldmlToMoment(format: string): string {
  return convert(format, { from: ldml, to: moment })
}

describe('literal text', () => {
  it.for([
    { format: '[Year] YYYY', expected: '\'Year\' yyyy' },
    { format: 'DD [of] MMMM', expected: 'dd \'of\' MMMM' },
  ])('re-escapes the bracketed literal in "$format" with quotes', ({ format, expected }) => {
    expect(momentToLdml(format)).toBe(expected)
  })

  it('decodes a quoted literal with an escaped apostrophe into brackets', () => {
    expect(ldmlToMoment('h \'o\'\'clock\'')).toBe('h [o\'clock]')
  })

  it('drops an empty literal', () => {
    expect(momentToLdml('[]')).toBe('')
  })

  // Moment brackets cannot escape `]`, so the character sits between two bracketed spans.
  it('keeps a literal `]` when converting into moment', () => {
    expect(ldmlToMoment('\'a]b\'')).toBe('[a]][b]')
  })

  it('reads a `]` between two bracketed spans as part of the literal', () => {
    expect(momentToLdml('[a]][b]')).toBe('\'a]b\'')
  })
})

describe('unrecognized letters', () => {
  // Moment has no `T`; LDML `T` would read back as the date-fns epoch token.
  it('escapes a letter the source does not define so the target cannot read it as a token', () => {
    expect(momentToLdml('YYYY-MM-DDTHH:mm:ss')).toBe('yyyy-MM-dd\'T\'HH:mm:ss')
  })

  it('escapes a run of unrecognized letters as one literal', () => {
    expect(momentToLdml('JJJ')).toBe('\'JJJ\'')
  })

  it.for([
    { format: 'QQQ', convert: ldmlToMoment, expected: '[QQQ]' },
    { format: 'MMMMM', convert: momentToLdml, expected: '\'MMMMM\'' },
  ])('keeps the over-long run "$format" as one literal instead of several shorter tokens', ({ format, convert, expected }) => {
    expect(convert(format)).toBe(expected)
  })

  // Escaping `J` and `b` separately in LDML would produce `'J''b'`, which reads back as `J'b`.
  it('escapes adjacent unrecognized letters together', () => {
    expect(momentToLdml('Jb')).toBe('\'Jb\'')
  })
})

describe('malformed delimiters', () => {
  it('reads an unterminated quote to the end of input as a literal', () => {
    expect(ldmlToMoment('\'abc')).toBe('[abc]')
  })

  it('keeps an unterminated bracket as literal text and parses the rest', () => {
    expect(momentToLdml('[Abc')).toBe('[a\'bc\'')
  })
})
