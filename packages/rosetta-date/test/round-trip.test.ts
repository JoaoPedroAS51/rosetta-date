import type { CanonicalToken } from '../src/core/canonical'
import type { DialectName } from '../src/dialects/registry'
import type { EndpointName } from './fixtures'
import { describe, expect, it } from 'vitest'
import { convert } from '../src'
import { parse } from '../src/core/parse'
import { composites, endpoints, grammarOf, renderOracle } from './fixtures'

const names = Object.keys(endpoints) as EndpointName[]
const pairs: ReadonlyArray<readonly [EndpointName, EndpointName]> = names.flatMap(
  from => names.filter(to => to !== from).map(to => [from, to] as const),
)

function roundTrip(format: string, from: EndpointName, to: EndpointName): string {
  const forward = convert(format, { from: endpoints[from], to: endpoints[to] })
  return convert(forward, { from: endpoints[to], to: endpoints[from] })
}

describe('single-token round trips (canonicals shared by both endpoints)', () => {
  for (const [from, to] of pairs) {
    const fromMap = renderOracle(from)
    const toMap = renderOracle(to)
    const shared = (Object.keys(fromMap) as CanonicalToken[]).filter(c => toMap[c] !== undefined)

    describe(`${from} → ${to} → ${from}`, () => {
      it.each(shared)('%s', (canonical) => {
        const token = fromMap[canonical]!
        expect(roundTrip(token, from, to)).toBe(token)
      })
    })
  }
})

describe('composite formats round-trip', () => {
  // Composites test literal/adjacency mechanics — a dialect-level concern — so they
  // round-trip across the literal-style boundary (dialect → other → dialect),
  // including the directive↔delimited boundary that `strftime` adds.
  const dialectNames = Object.keys(composites) as DialectName[]
  const dialectPairs = dialectNames.flatMap(
    from => dialectNames.filter(to => to !== from).map(to => [from, to] as const),
  )

  // A composite only round-trips through a partner that renders all of its fields:
  // dialects do not fully overlap (e.g. `strftime` has no numeric 12-hour like `h`).
  function renderable(format: string, from: DialectName, to: DialectName): boolean {
    const oracle = renderOracle(to)
    return parse(format, grammarOf(from)).every(
      segment => segment.kind !== 'field' || oracle[segment.canonical] !== undefined,
    )
  }

  for (const [from, to] of dialectPairs) {
    const formats = (composites[from] ?? []).filter(format => renderable(format, from, to))
    if (formats.length === 0)
      continue

    describe(`${from} → ${to} → ${from}`, () => {
      it.each(formats)('%s', (format) => {
        expect(roundTrip(format, from, to)).toBe(format)
      })
    })
  }
})
