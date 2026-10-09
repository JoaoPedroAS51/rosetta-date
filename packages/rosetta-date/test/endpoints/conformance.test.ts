import type { CanonicalToken } from 'rosetta-date'
import type { EndpointName } from '../fixtures/oracle'
import { convert, describe as describePattern } from 'rosetta-date'
import { describe, expect, it } from 'vitest'
import { renderedTokens } from '../../src/core/render'
import { aliases, endpoints, renderOracle } from '../fixtures/oracle'
import { names } from '../fixtures/pairs'

describe.for(names)('%s', (name) => {
  const endpoint = endpoints[name]
  const entries = Object.entries(renderOracle(name)) as Array<[CanonicalToken, string]>

  it.for(entries)('reads %s from token "%s"', ([canonical, token]) => {
    expect(describePattern(token, endpoint)).toMatchObject([{ kind: 'field', canonical, token }])
  })

  it.for(entries)('writes %s as token "%s"', ([_canonical, token]) => {
    expect(convert(token, { from: endpoint, to: endpoint })).toBe(token)
  })

  it('renders exactly the canonicals in its oracle', () => {
    expect(new Set(renderedTokens(endpoint).keys())).toEqual(new Set(Object.keys(renderOracle(name))))
  })
})

describe.for((Object.keys(aliases) as EndpointName[]).filter(name => (aliases[name] ?? []).length > 0))('%s aliases', (name) => {
  it.for(aliases[name] ?? [])('parses "%s" as %s', ([token, canonical]) => {
    expect(describePattern(token, endpoints[name])).toMatchObject([{ kind: 'field', canonical, token }])
  })
})
