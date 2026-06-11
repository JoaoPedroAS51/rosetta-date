import { expect, it } from 'vitest'
import { __ROSETTA_DATE_PLACEHOLDER__ } from './index'

it('exposes the placeholder export', () => {
  expect(__ROSETTA_DATE_PLACEHOLDER__).toBe(true)
})
