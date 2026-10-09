import { convert } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'
import { describe, expect, it } from 'vitest'

// Epoch tokens, ISO week helpers and localized presets belong to the `dateFns` library, not to UTS #35.
describe('ldml', () => {
  it.for([
    { token: 't', field: 'epoch seconds' },
    { token: 'I', field: 'ISO week' },
    { token: 'P', field: 'localized date' },
  ])('does not read the date-fns $field token "$token"', ({ token }) => {
    expect(convert(token, { from: ldml, to: moment })).toBe(`[${token}]`)
  })

  it.for([
    { token: 'X', field: 'epoch seconds' },
    { token: 'L', field: 'localized date' },
  ])('has no token for moment $field "$token"', ({ token }) => {
    expect(convert(token, { from: moment, to: ldml })).toBe(`'${token}'`)
  })
})
