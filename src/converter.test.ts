import { describe, expect, it } from 'vitest'
import { convert, createConverter } from './converter'

describe('convert', () => {
  it('converts in both directions by name', () => {
    expect(convert('DD/MM/YYYY', { from: 'moment', to: 'unicode' })).toBe('dd/MM/yyyy')
    expect(convert('yyyy-MM-dd', { from: 'unicode', to: 'moment' })).toBe('YYYY-MM-DD')
  })

  it('is a no-op when from and to are the same dialect', () => {
    expect(convert('DD/MM/YYYY', { from: 'moment', to: 'moment' })).toBe('DD/MM/YYYY')
  })
})

describe('createConverter', () => {
  it('binds a fixed direction and is reusable', () => {
    const toDateFns = createConverter('moment', 'unicode')
    expect(toDateFns('YYYY-MM-DD')).toBe('yyyy-MM-dd')
    expect(toDateFns('hh:mm A')).toBe('hh:mm a')
  })

  it('matches convert for the same direction', () => {
    const toMoment = createConverter('unicode', 'moment')
    expect(toMoment('dd/MM/yyyy')).toBe(convert('dd/MM/yyyy', { from: 'unicode', to: 'moment' }))
  })
})
