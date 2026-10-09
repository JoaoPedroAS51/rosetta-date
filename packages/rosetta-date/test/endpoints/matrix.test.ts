import type { CanonicalToken } from 'rosetta-date'
import { convert } from 'rosetta-date'
import { describe, expect, it } from 'vitest'
import { resolveSyntax } from '../../src/core/syntax'
import { endpoints, grammarOf, renderOracle } from '../fixtures/oracle'
import { names, pairsOf } from '../fixtures/pairs'

describe.for(pairsOf(names))('%s → %s', ([from, to]) => {
  const fromMap = renderOracle(from)
  const toMap = renderOracle(to)
  const canonicals = Object.keys(fromMap) as CanonicalToken[]
  const shared = canonicals.filter(canonical => toMap[canonical] !== undefined)
  const oneSided = canonicals.filter(canonical => toMap[canonical] === undefined)

  it.for(shared)('converts %s', (canonical) => {
    expect(convert(fromMap[canonical]!, { from: endpoints[from], to: endpoints[to] })).toBe(toMap[canonical])
  })

  it.for(oneSided)('escapes %s as a literal', (canonical) => {
    const token = fromMap[canonical]!
    expect(convert(token, { from: endpoints[from], to: endpoints[to] })).toBe(resolveSyntax(grammarOf(to).syntax).escapeLiteral(token))
  })
})
