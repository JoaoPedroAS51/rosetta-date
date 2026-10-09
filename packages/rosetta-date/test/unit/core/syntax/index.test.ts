import type { TokenSyntax } from 'rosetta-date'
import { describe, expect, it } from 'vitest'
import { resolveSyntax } from '../../../../src/core/syntax'

describe('resolveSyntax', () => {
  it('throws on an unknown syntax kind', () => {
    expect(() => resolveSyntax({ kind: 'mystery' } as unknown as TokenSyntax)).toThrow(/Unhandled variant/)
  })
})
