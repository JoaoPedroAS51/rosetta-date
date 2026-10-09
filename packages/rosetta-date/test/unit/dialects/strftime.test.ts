import type { Dialect } from 'rosetta-date'
import { Canonical, convert } from 'rosetta-date'
import { ldml, moment, strftime } from 'rosetta-date/dialects'
import { describe, expect, it } from 'vitest'
import { unsupportedError } from '../../fixtures/errors'

function fromStrftime(format: string, to: Dialect = moment): string {
  return convert(format, { from: strftime, to })
}

function normalize(format: string): string {
  return convert(format, { from: strftime, to: strftime })
}

describe('strftime', () => {
  it('converts a moment pattern into directives', () => {
    expect(convert('YYYY-MM-DD HH:mm:ss', { from: moment, to: strftime })).toBe('%Y-%m-%d %H:%M:%S')
  })

  it.for([
    { to: moment, expected: 'YYYY-MM-DD' },
    { to: ldml, expected: 'yyyy-MM-dd' },
  ])('converts directives into $to.name', ({ to, expected }) => {
    expect(fromStrftime('%Y-%m-%d', to)).toBe(expected)
  })

  it('writes adjacent directives without a separator', () => {
    expect(convert('YYYYMMDD', { from: moment, to: strftime })).toBe('%Y%m%d')
  })

  it('reads adjacent directives without a separator', () => {
    expect(fromStrftime('%Y%m%d')).toBe('YYYYMMDD')
  })

  it('reads non-directive text as a literal', () => {
    expect(fromStrftime('%Y年')).toBe('YYYY年')
  })

  it('keeps `%%` as a literal percent', () => {
    expect(normalize('%H%%')).toBe('%H%%')
  })

  it('escapes a literal percent as `%%`', () => {
    expect(convert('[%] HH', { from: moment, to: strftime })).toBe('%% %H')
  })

  it('maps the ISO 2-digit week-year to moment', () => {
    expect(fromStrftime('%g')).toBe('GG')
  })

  it('maps the moment ISO 2-digit week-year to `%g`', () => {
    expect(convert('GG', { from: moment, to: strftime })).toBe('%g')
  })

  it('maps weekday names and the day period', () => {
    expect(fromStrftime('%A %p')).toBe('dddd A')
  })

  it('maps the locale date-time preset', () => {
    expect(fromStrftime('%c')).toBe('LLLL')
  })
})

describe('padding', () => {
  it('keeps the blank-padded directives distinct from the zero-padded ones', () => {
    expect(normalize('%e %k %l')).toBe('%e %k %l')
  })

  it('reads the glibc `%_` flag on day and hours as the blank-padded directives', () => {
    expect(normalize('%_d %_H %_I')).toBe('%e %k %l')
  })

  it('keeps the glibc `%_` flag on fields with no blank-padded directive', () => {
    expect(normalize('%_m %_M %_S %_j %_V')).toBe('%_m %_M %_S %_j %_V')
  })

  it.for(['%e', '%_m'])('reports blank-padded "%s" as unmappable in moment', (format) => {
    expect(() => convert(format, { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow(unsupportedError(format, 'unmappable'))
  })

  it.for([
    { format: '%-d', expected: 'D' },
    { format: '%-H:%-M:%-S', expected: 'H:m:s' },
  ])('reads the glibc `%-` flag in "$format" as the unpadded style', ({ format, expected }) => {
    expect(fromStrftime(format)).toBe(expected)
  })

  it('writes the moment unpadded day as `%-d`', () => {
    expect(convert('D', { from: moment, to: strftime })).toBe('%-d')
  })

  it('normalizes the redundant glibc `%0` flag to the plain directive', () => {
    expect(normalize('%0d')).toBe('%d')
  })

  it('reads the glibc `%0` flag as zero-padded', () => {
    expect(fromStrftime('%0H%0M')).toBe('HHmm')
  })
})

describe('day period case', () => {
  it.for([
    { format: '%p', expected: 'A' },
    { format: '%P', expected: 'a' },
  ])('maps "$format" to moment "$expected"', ({ format, expected }) => {
    expect(fromStrftime(format)).toBe(expected)
  })

  it('writes the moment lowercase day period as `%P`', () => {
    expect(convert('a', { from: moment, to: strftime })).toBe('%P')
  })

  it('keeps `%P` within strftime', () => {
    expect(normalize('%P')).toBe('%P')
  })

  it('reports `%P` as unmappable in ldml, which cannot force lowercase', () => {
    expect(() => convert('%P', { from: strftime, to: ldml, onUnsupportedToken: 'throw' })).toThrow(unsupportedError('%P', 'unmappable'))
  })
})

describe('century', () => {
  it('keeps `%C` within strftime', () => {
    expect(normalize('%C')).toBe('%C')
  })

  it('reports `%C` as unmappable in moment', () => {
    expect(() => convert('%C', { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow(unsupportedError('%C', 'unmappable'))
  })
})

describe('unrecognized directives', () => {
  it('reports an undefined directive as unrecognized', () => {
    expect(() => convert('%Q', { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow(unsupportedError('%Q', 'unrecognized'))
  })

  it('reports a trailing marker as unrecognized', () => {
    expect(() => convert('%Y %', { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow(unsupportedError('%', 'unrecognized'))
  })

  it('escapes adjacent unrecognized directives as literal percents', () => {
    expect(normalize('%Q%W')).toBe('%%Q%%W')
  })
})

describe('composite directives', () => {
  it.for([
    { format: '%T', to: moment, expected: 'HH:mm:ss' },
    { format: '%R', to: moment, expected: 'HH:mm' },
    { format: '%F', to: ldml, expected: 'yyyy-MM-dd' },
    { format: '%D', to: moment, expected: 'MM/DD/YY' },
    { format: '%r', to: moment, expected: 'hh:mm:ss A' },
    { format: '%F %T', to: moment, expected: 'YYYY-MM-DD HH:mm:ss' },
  ])('expands "$format" into $to.name', ({ format, to, expected }) => {
    expect(fromStrftime(format, to)).toBe(expected)
  })

  it('normalizes a composite to its expansion within strftime', () => {
    expect(normalize('%T')).toBe('%H:%M:%S')
  })

  it.for([
    { format: '%Y%n%H', expected: 'YYYY\nHH' },
    { format: '%H%t%M', expected: 'HH\tmm' },
  ])('expands the whitespace directive in "$format"', ({ format, expected }) => {
    expect(fromStrftime(format)).toBe(expected)
  })

  it.for([
    { format: '%n', expected: '\n' },
    { format: '%t', expected: '\t' },
  ])('normalizes "$format" to the raw character within strftime', ({ format, expected }) => {
    expect(normalize(format)).toBe(expected)
  })

  // A plain `Dialect` skips `defineDialect` validation, so a broken expansion reaches the parser.
  it('reports an unrecognized token inside an expansion', () => {
    const broken: Dialect = {
      name: 'broken',
      syntax: { kind: 'directive', marker: '%' },
      tokens: [{ token: '%H', canonical: Canonical.HourTwoDigitH23 }],
      composites: [{ token: '%T', expandsTo: '%H%Q' }],
    }
    expect(() => convert('%T', { from: broken, to: moment, onUnsupportedToken: 'throw' })).toThrow(unsupportedError('%Q', 'unrecognized'))
  })
})
