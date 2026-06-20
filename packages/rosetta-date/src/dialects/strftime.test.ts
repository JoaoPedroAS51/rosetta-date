import { describe, expect, it } from 'vitest'
import { convert } from '../converter'
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
})
