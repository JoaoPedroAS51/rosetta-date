import type { CanonicalToken } from '../src/core/canonical'
import type { DialectName } from '../src/dialects/registry'
import { describe, expect, it } from 'vitest'
import { convert } from '../src'
import { composites, expectations } from './fixtures'

const names = Object.keys(expectations) as DialectName[]
const pairs: ReadonlyArray<readonly [DialectName, DialectName]> = names.flatMap(
  from => names.filter(to => to !== from).map(to => [from, to] as const),
)

function roundTrip(format: string, from: DialectName, to: DialectName): string {
  return convert(convert(format, { from, to }), { from: to, to: from })
}

describe('single-token round trips (canonicals shared by both dialects)', () => {
  for (const [from, to] of pairs) {
    const fromMap = expectations[from]
    const toMap = expectations[to]
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
  for (const [from, to] of pairs) {
    const formats = composites[from] ?? []
    if (formats.length === 0)
      continue

    describe(`${from} → ${to} → ${from}`, () => {
      it.each(formats)('%s', (format) => {
        expect(roundTrip(format, from, to)).toBe(format)
      })
    })
  }
})
