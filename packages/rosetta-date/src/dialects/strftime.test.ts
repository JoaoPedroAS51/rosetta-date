import type { Dialect } from '../core/types'
import { describe, expect, it } from 'vitest'
import { convert } from '../converter'
import { Canonical } from '../core/canonical'
import { ldml } from './ldml'
import { moment } from './moment'
import { strftime } from './strftime'

describe('strftime dialect', () => {
  it('converts a pattern into strftime directives', () => {
    expect(convert('YYYY-MM-DD HH:mm:ss', { from: moment, to: strftime })).toBe('%Y-%m-%d %H:%M:%S')
  })

  it('converts strftime directives into other dialects', () => {
    expect(convert('%Y-%m-%d', { from: strftime, to: moment })).toBe('YYYY-MM-DD')
    expect(convert('%Y-%m-%d', { from: strftime, to: ldml })).toBe('yyyy-MM-dd')
  })

  it('keeps adjacent directives together — self-delimiting, no separator', () => {
    expect(convert('YYYYMMDD', { from: moment, to: strftime })).toBe('%Y%m%d')
    expect(convert('%Y%m%d', { from: strftime, to: moment })).toBe('YYYYMMDD')
  })

  it('treats non-directive text as a literal', () => {
    expect(convert('%Y年', { from: strftime, to: moment })).toBe('YYYY年')
  })

  it('escapes a literal percent as `%%`', () => {
    expect(convert('%H%%', { from: strftime, to: strftime })).toBe('%H%%')
    expect(convert('[%] HH', { from: moment, to: strftime })).toBe('%% %H')
  })

  it('carries the blank-padded styles, distinct from zero-padded', () => {
    expect(convert('%e %k %l', { from: strftime, to: strftime })).toBe('%e %k %l')
    // No other modeled dialect has a blank-padded day, so it has no clean target.
    expect(() => convert('%e', { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow()
  })

  it('maps the ISO 2-digit week-year, shared with other dialects', () => {
    expect(convert('%g', { from: strftime, to: moment })).toBe('GG')
    expect(convert('GG', { from: moment, to: strftime })).toBe('%g')
  })

  it('carries the century, which has no clean target elsewhere', () => {
    expect(convert('%C', { from: strftime, to: strftime })).toBe('%C')
    // No other modeled dialect renders a century, so it has no clean target.
    expect(() => convert('%C', { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow()
  })

  it('surfaces an unrecognized directive to the policy', () => {
    expect(() => convert('%Q', { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow(/%Q/)
  })

  it('treats a lone trailing marker as unrecognized', () => {
    expect(() => convert('%Y %', { from: strftime, to: moment, onUnsupportedToken: 'throw' })).toThrow(/%/)
  })

  it('coalesces adjacent unrecognized directives and re-escapes them', () => {
    // `%Q%W` are both undefined: they coalesce, then round-trip back through `%%`.
    expect(convert('%Q%W', { from: strftime, to: strftime })).toBe('%%Q%%W')
  })

  it('maps weekday names, the day period, and locale presets', () => {
    expect(convert('%A %p', { from: strftime, to: moment })).toBe('dddd A')
    expect(convert('%c', { from: strftime, to: moment })).toBe('LLLL')
  })

  describe('composite directives', () => {
    it('expands a composite to its sub-pattern when converting out', () => {
      expect(convert('%T', { from: strftime, to: moment })).toBe('HH:mm:ss')
      expect(convert('%R', { from: strftime, to: moment })).toBe('HH:mm')
      expect(convert('%F', { from: strftime, to: ldml })).toBe('yyyy-MM-dd')
      expect(convert('%D', { from: strftime, to: moment })).toBe('MM/DD/YY')
      expect(convert('%r', { from: strftime, to: moment })).toBe('hh:mm:ss A')
    })

    it('normalizes a composite to its expansion on a round trip (parse-only)', () => {
      expect(convert('%T', { from: strftime, to: strftime })).toBe('%H:%M:%S')
    })

    it('expands composites mixed with literals and atomic directives', () => {
      expect(convert('%F %T', { from: strftime, to: moment })).toBe('YYYY-MM-DD HH:mm:ss')
    })

    it('expands `%n`/`%t` to literal whitespace', () => {
      expect(convert('%Y%n%H', { from: strftime, to: moment })).toBe('YYYY\nHH')
      expect(convert('%H%t%M', { from: strftime, to: moment })).toBe('HH\tmm')
    })

    it('normalizes `%n`/`%t` to the raw character on a round trip (parse-only)', () => {
      expect(convert('%n', { from: strftime, to: strftime })).toBe('\n')
      expect(convert('%t', { from: strftime, to: strftime })).toBe('\t')
    })

    it('surfaces an unrecognized token inside a composite expansion', () => {
      // Built without `defineDialect`, so the malformed expansion is not rejected;
      // parsing degrades gracefully and routes the unknown to the policy.
      const broken: Dialect = {
        name: 'broken',
        syntax: { kind: 'directive', marker: '%' },
        tokens: [{ token: '%H', canonical: Canonical.HourTwoDigitH23 }],
        composites: [{ token: '%T', expandsTo: '%H%Q' }],
      }
      expect(() => convert('%T', { from: broken, to: moment, onUnsupportedToken: 'throw' })).toThrow(/%Q/)
    })
  })
})
