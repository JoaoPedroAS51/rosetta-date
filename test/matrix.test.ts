import type { CanonicalToken } from '../src/core/canonical'
import type { DialectName } from '../src/dialects/registry'
import { describe, expect, it } from 'vitest'
import { convert } from '../src'
import { escapeLiteral } from '../src/core/literal'
import { parse } from '../src/core/parse'
import { render } from '../src/core/render'
import { dialects } from '../src/dialects/registry'
import { aliases, expectations } from './fixtures'

const names = Object.keys(expectations) as DialectName[]
const pairs: ReadonlyArray<readonly [DialectName, DialectName]> = names.flatMap(
  from => names.filter(to => to !== from).map(to => [from, to] as const),
)

function canonicalsOf(name: DialectName): CanonicalToken[] {
  return Object.keys(expectations[name]) as CanonicalToken[]
}

describe('dialect conformance (each dialect ↔ the canonical hub)', () => {
  for (const name of names) {
    const map = expectations[name]
    const entries = Object.entries(map) as Array<[CanonicalToken, string]>

    describe(name, () => {
      it.each(entries)('%s ↔ token "%s"', (canonical, token) => {
        // The primary token parses to its canonical symbol...
        expect(parse(token, dialects[name])).toEqual([{ kind: 'field', canonical, raw: token }])
        // ...and that symbol renders back to the primary token.
        expect(render([{ kind: 'field', canonical, raw: token }], dialects[name])).toBe(token)
      })
    })
  }
})

describe('aliases parse to their canonical symbol', () => {
  for (const name of names) {
    const list = aliases[name] ?? []
    if (list.length === 0)
      continue

    describe(name, () => {
      it.each(list)('"%s" → %s', (token, canonical) => {
        expect(parse(token, dialects[name])).toEqual([{ kind: 'field', canonical, raw: token }])
      })
    })
  }
})

describe('cross-dialect conversion matrix', () => {
  for (const [from, to] of pairs) {
    const fromMap = expectations[from]
    const toMap = expectations[to]

    describe(`${from} → ${to}`, () => {
      const shared = canonicalsOf(from).filter(canonical => toMap[canonical] !== undefined)
      it.each(shared)('%s', (canonical) => {
        expect(convert(fromMap[canonical]!, { from: dialects[from], to: dialects[to] })).toBe(toMap[canonical])
      })

      // Symbols the source can express but the target cannot must become escaped
      // literals — never a wrong guess or a silently re-readable token.
      const oneSided = canonicalsOf(from).filter(canonical => toMap[canonical] === undefined)
      if (oneSided.length > 0) {
        it.each(oneSided)('%s has no %s token → escaped literal', (canonical) => {
          const token = fromMap[canonical]!
          expect(convert(token, { from: dialects[from], to: dialects[to] })).toBe(escapeLiteral(token, dialects[to].literal))
        })
      }
    })
  }
})
