import { describe, expect, it } from 'vitest'
import { Canonical } from './canonical'
import { decodeCanonical } from './decode'

// Presentation qualifiers refine only the rendered surface, so the grammar's
// order rule places them after identity qualifiers, which change the value.
const PRESENTATION_QUALIFIERS = new Set(['space-padded', 'lower'])

describe('canonical vocabulary', () => {
  it('orders identity qualifiers before presentation ones in every value', () => {
    const offenders = Object.values(Canonical).filter((value) => {
      const { qualifiers } = decodeCanonical(value)
      const firstPresentation = qualifiers.findIndex(q => PRESENTATION_QUALIFIERS.has(q))
      return firstPresentation !== -1 && qualifiers.slice(firstPresentation).some(q => !PRESENTATION_QUALIFIERS.has(q))
    })
    expect(offenders).toEqual([])
  })
})
