import type { Dialect } from 'rosetta-date'
import { Canonical, describe as describePattern } from 'rosetta-date'
import { describe, expect, it } from 'vitest'

describe('tokenization', () => {
  it('matches the longest token regardless of declaration order', () => {
    const dialect: Dialect = {
      name: 'order',
      syntax: { kind: 'delimited', open: '[', close: ']' },
      tokens: [
        { token: 'Y', canonical: Canonical.YearTwoDigit },
        { token: 'YYYY', canonical: Canonical.YearNumeric },
      ],
    }
    expect(describePattern('YYYY', dialect)).toMatchObject([{ kind: 'field', token: 'YYYY', canonical: Canonical.YearNumeric }])
  })
})
