import type { TokenSyntax } from '../types'
import { describe, expect, it } from 'vitest'
import { resolveSyntax } from './index'

describe('resolveSyntax', () => {
  it('caches the strategy by config identity', () => {
    const syntax: TokenSyntax = { kind: 'delimited', open: '[', close: ']' }
    expect(resolveSyntax(syntax)).toBe(resolveSyntax(syntax))
  })

  it('resolves each family to its own strategy', () => {
    const delimited = resolveSyntax({ kind: 'delimited', open: '[', close: ']' })
    const directive = resolveSyntax({ kind: 'directive', marker: '%' })
    expect(delimited).not.toBe(directive)
  })

  it('throws on an unhandled syntax kind (exhaustiveness guard)', () => {
    expect(() => resolveSyntax({ kind: 'mystery' } as unknown as TokenSyntax)).toThrow(/Unhandled variant/)
  })
})
