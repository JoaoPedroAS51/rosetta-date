import type { CanonicalToken, DescribedSegment, ExplainedReason, ExplainedSegment } from 'rosetta-date'
import { describe as describePattern, explain } from 'rosetta-date'
import { describe, expectTypeOf, it } from 'vitest'

describe('describe', () => {
  it('returns described segments', () => {
    expectTypeOf(describePattern).returns.toEqualTypeOf<DescribedSegment[]>()
  })

  it('narrows a field segment to its token and canonical', () => {
    expectTypeOf<Extract<DescribedSegment, { kind: 'field' }>['token']>().toEqualTypeOf<string>()
    expectTypeOf<Extract<DescribedSegment, { kind: 'field' }>['canonical']>().toEqualTypeOf<CanonicalToken>()
  })

  it('narrows literal and unknown segments to their value', () => {
    expectTypeOf<Extract<DescribedSegment, { kind: 'literal' | 'unknown' }>['value']>().toEqualTypeOf<string>()
  })
})

describe('explain', () => {
  it('returns explained segments', () => {
    expectTypeOf(explain).returns.toEqualTypeOf<ExplainedSegment[]>()
  })

  it('exposes the target spelling only on a converted field', () => {
    expectTypeOf<Extract<ExplainedSegment, { status: 'converted' }>['target']>().toEqualTypeOf<string>()
    expectTypeOf<Extract<ExplainedSegment, { status: 'unsupported' }>>().not.toHaveProperty('target')
  })

  it('exposes the reason only on an unsupported field', () => {
    expectTypeOf<Extract<ExplainedSegment, { status: 'unsupported' }>['reason']>().toEqualTypeOf<ExplainedReason>()
    expectTypeOf<ExplainedReason>().toEqualTypeOf<'unmappable' | 'unsupported-by-target'>()
  })
})
