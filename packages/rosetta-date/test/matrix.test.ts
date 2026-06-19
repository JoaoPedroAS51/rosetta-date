import type { CanonicalToken } from '../src/core/canonical'
import type { DialectName } from '../src/dialects/registry'
import type { EndpointName } from './fixtures'
import { describe, expect, it } from 'vitest'
import { convert } from '../src'
import { escapeLiteral } from '../src/core/literal'
import { parse } from '../src/core/parse'
import { render, renderedTokens } from '../src/core/render'
import { aliases, endpoints, grammarOf, renderOracle } from './fixtures'

const names = Object.keys(endpoints) as EndpointName[]
const pairs: ReadonlyArray<readonly [EndpointName, EndpointName]> = names.flatMap(
  from => names.filter(to => to !== from).map(to => [from, to] as const),
)

function canonicalsOf(name: EndpointName): CanonicalToken[] {
  return Object.keys(renderOracle(name)) as CanonicalToken[]
}

describe('endpoint conformance (each endpoint ↔ the canonical hub)', () => {
  for (const name of names) {
    const entries = Object.entries(renderOracle(name)) as Array<[CanonicalToken, string]>
    const grammar = grammarOf(name)
    const endpoint = endpoints[name]

    describe(name, () => {
      it.each(entries)('%s ↔ token "%s"', (canonical, token) => {
        // The primary token parses (through the effective grammar) to its symbol...
        expect(parse(token, grammar)).toEqual([{ kind: 'field', canonical, raw: token }])
        // ...and that symbol renders back to the primary token through the endpoint.
        expect(render([{ kind: 'field', canonical, raw: token }], endpoint)).toBe(token)
      })
    })
  }
})

describe('aliases parse to their canonical symbol', () => {
  // Aliases are parse-side, dialect-level; exercise them through the dialect grammar.
  for (const name of Object.keys(aliases) as DialectName[]) {
    const list = aliases[name] ?? []
    if (list.length === 0)
      continue

    describe(name, () => {
      it.each(list)('"%s" → %s', (token, canonical) => {
        expect(parse(token, grammarOf(name))).toEqual([{ kind: 'field', canonical, raw: token }])
      })
    })
  }
})

describe('endpoint totality (what it renders matches its oracle exactly)', () => {
  // Independent cross-check: the engine's rendered set (driven by the library's
  // `supports`/`extends`) must equal the oracle's keys (driven by the delta). They
  // are authored from opposite sides, so any drift — or a field added to the
  // vocabulary that a library silently starts/keeps claiming — breaks this.
  it.each(names)('%s', (name) => {
    expect(new Set(renderedTokens(endpoints[name]).keys())).toEqual(new Set(Object.keys(renderOracle(name))))
  })
})

describe('cross-endpoint conversion matrix', () => {
  for (const [from, to] of pairs) {
    const fromMap = renderOracle(from)
    const toMap = renderOracle(to)

    describe(`${from} → ${to}`, () => {
      const shared = canonicalsOf(from).filter(canonical => toMap[canonical] !== undefined)
      it.each(shared)('%s', (canonical) => {
        expect(convert(fromMap[canonical]!, { from: endpoints[from], to: endpoints[to] })).toBe(toMap[canonical])
      })

      // Fields the source can express but the target cannot render must become
      // escaped literals — never a wrong guess or a silently re-readable token.
      const oneSided = canonicalsOf(from).filter(canonical => toMap[canonical] === undefined)
      if (oneSided.length > 0) {
        it.each(oneSided)('%s has no %s token → escaped literal', (canonical) => {
          const token = fromMap[canonical]!
          expect(convert(token, { from: endpoints[from], to: endpoints[to] })).toBe(escapeLiteral(token, grammarOf(to).literal))
        })
      }
    })
  }
})
