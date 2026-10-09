import type { CanonicalToken } from 'rosetta-date'
import type { DialectName } from 'rosetta-date/dialects'
import { describe as describePattern } from 'rosetta-date'
import { describe, expect, it } from 'vitest'
import { composites, endpoints, renderOracle } from '../fixtures/oracle'
import { names, pairsOf, roundTrip } from '../fixtures/pairs'

describe.for(pairsOf(names))('single tokens from %s through %s', ([from, to]) => {
  const fromMap = renderOracle(from)
  const toMap = renderOracle(to)
  const shared = (Object.keys(fromMap) as CanonicalToken[]).filter(canonical => toMap[canonical] !== undefined)

  it.for(shared)('keeps %s', (canonical) => {
    const token = fromMap[canonical]!
    expect(roundTrip(token, from, to)).toBe(token)
  })
})

// A composite round-trips only through a partner that renders every one of its fields.
function renderable(format: string, from: DialectName, to: DialectName): boolean {
  const oracle = renderOracle(to)
  return describePattern(format, endpoints[from]).every(
    segment => segment.kind !== 'field' || oracle[segment.canonical] !== undefined,
  )
}

const compositePairs = pairsOf(Object.keys(composites) as DialectName[])
  .map(([from, to]) => ({ from, to, formats: (composites[from] ?? []).filter(format => renderable(format, from, to)) }))
  .filter(({ formats }) => formats.length > 0)

describe.for(compositePairs)('composite formats from $from through $to', ({ from, to, formats }) => {
  it.for(formats)('keeps "%s"', (format) => {
    expect(roundTrip(format, from, to)).toBe(format)
  })
})
