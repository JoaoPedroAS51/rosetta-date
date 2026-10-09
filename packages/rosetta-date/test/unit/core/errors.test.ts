import { UnsupportedTokenError } from 'rosetta-date'
import { describe, expect, it } from 'vitest'

describe('unsupported-token error', () => {
  it.for([
    { reason: 'unrecognized', message: 'Unrecognized token "K" in the source dialect' },
    { reason: 'unmappable', message: 'Token "K" has no equivalent in the target dialect' },
    { reason: 'unsupported-by-target', message: 'Token "K" is not rendered by the target library' },
    { reason: 'unrepresentable-adjacency', message: 'Token "K" cannot follow the previous token in the target dialect without merging into a different token' },
  ] as const)('describes an $reason token in its message', ({ reason, message }) => {
    expect(new UnsupportedTokenError('K', reason).message).toBe(message)
  })

  it('exposes the token and reason', () => {
    expect(new UnsupportedTokenError('K', 'unmappable')).toMatchObject({ token: 'K', reason: 'unmappable' })
  })

  it('is an Error named UnsupportedTokenError', () => {
    const error = new UnsupportedTokenError('K', 'unmappable')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('UnsupportedTokenError')
  })
})
