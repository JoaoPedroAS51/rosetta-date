import { convert, explain } from 'rosetta-date'
import { dayjs, momentjs } from 'rosetta-date/libraries'
import { describe, expect, it } from 'vitest'

describe('dayjs', () => {
  it('renders the calendar year in the moment primary spelling', () => {
    expect(explain('Y', { from: momentjs, to: dayjs })).toMatchObject([{ status: 'converted', target: 'YYYY' }])
  })

  it('converts the moment alias `Y` to the primary spelling', () => {
    expect(convert('Y', { from: momentjs, to: dayjs })).toBe('YYYY')
  })
})
