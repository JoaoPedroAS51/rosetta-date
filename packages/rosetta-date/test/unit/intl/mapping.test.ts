import { Canonical } from 'rosetta-date'
import { describe, expect, it } from 'vitest'
import { canonicalToIntl, intlToCanonical } from '../../../src/intl/mapping'

const mappable = Object.values(Canonical).filter(canonical => canonicalToIntl(canonical) !== undefined)

describe('intl mapping tables', () => {
  it.for(mappable)('maps the Intl options of %s back to it', (canonical) => {
    expect(intlToCanonical(canonicalToIntl(canonical)!)).toEqual({ tokens: [canonical], unsupported: [] })
  })
})
