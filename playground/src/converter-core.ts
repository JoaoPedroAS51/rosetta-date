import type { ExplainedSegment, UnsupportedTokenPolicy, UnsupportedTokenReason } from 'rosetta-date'
import type { Endpoint } from './endpoints'
import { convert, explain, Unsupported, UnsupportedTokenError } from 'rosetta-date'
import { toIntlOptions } from 'rosetta-date/intl'

export type PolicyChoice = 'literalize' | 'throw' | 'drop'

export interface UnsupportedHit {
  readonly token: string
  readonly reason: UnsupportedTokenReason
}

export interface ConvertOutcome {
  readonly ok: boolean
  readonly output: string
  readonly errorMessage?: string
  /** Tokens that cannot be converted, regardless of the active policy. */
  readonly unsupported: readonly UnsupportedHit[]
}

export const reasonText: Record<UnsupportedTokenReason, string> = {
  'unrecognized': 'the source grammar does not define this token',
  'unmappable': 'no counterpart in the target grammar',
  'unsupported-by-target': 'the target library cannot render this field',
  'unrepresentable-adjacency': 'would re-merge with its neighbour, and the target has no empty literal to separate them',
}

function policyValue(policy: PolicyChoice): UnsupportedTokenPolicy {
  if (policy === 'drop')
    return () => Unsupported.drop
  return policy
}

/** Convert a format and collect every unsupported token without changing the selected policy's result. */
export function runConvert(from: Endpoint, to: Endpoint, format: string, policy: PolicyChoice): ConvertOutcome {
  const unsupported: UnsupportedHit[] = []
  try {
    convert(format, {
      from: from.value,
      to: to.value,
      onUnsupportedToken: (token, info) => {
        unsupported.push({ token, reason: info.reason })
        return Unsupported.literalize
      },
    })
  }
  catch {
    // The policy-aware pass below returns non-token parse errors.
  }

  try {
    const output = convert(format, { from: from.value, to: to.value, onUnsupportedToken: policyValue(policy) })
    return { ok: true, output, unsupported }
  }
  catch (error) {
    const errorMessage = error instanceof UnsupportedTokenError ? error.message : String(error)
    return { ok: false, output: '', errorMessage, unsupported }
  }
}

/** Return whether a round trip reproduces the input, or `null` if either conversion fails. */
export function roundTrip(from: Endpoint, to: Endpoint, format: string): { ok: boolean, back: string } | null {
  try {
    const forward = convert(format, { from: from.value, to: to.value })
    const back = convert(forward, { from: to.value, to: from.value })
    return { ok: back === format, back }
  }
  catch {
    return null
  }
}

/** Explain each token in the conversion. */
export function explainConversion(from: Endpoint, to: Endpoint, format: string): ExplainedSegment[] {
  try {
    return explain(format, { from: from.value, to: to.value })
  }
  catch {
    return []
  }
}

export interface IntlOutcome {
  readonly ok: boolean
  readonly options: Intl.DateTimeFormatOptions
  /** The sample date rendered with the derived options. */
  readonly sample: string
  readonly errorMessage?: string
}

const SAMPLE_DATE = new Date(Date.UTC(2026, 5, 19, 14, 30, 0))

/** Build `Intl.DateTimeFormatOptions` and render the sample date. */
export function toIntl(from: Endpoint, format: string): IntlOutcome {
  try {
    const options = toIntlOptions(format, { from: from.value })
    let sample = ''
    try {
      sample = new Intl.DateTimeFormat(undefined, options).format(SAMPLE_DATE)
    }
    catch {
      // Invalid option combinations have no sample.
    }
    return { ok: true, options, sample }
  }
  catch (error) {
    return { ok: false, options: {}, sample: '', errorMessage: String(error) }
  }
}

/** Generate a copyable `convert(...)` call. */
export function toSnippet(from: Endpoint, to: Endpoint, format: string, policy: PolicyChoice): string {
  const imports = new Map<string, Set<string>>([['rosetta-date', new Set(['convert'])]])
  const addEndpointImport = (endpoint: Endpoint): void => {
    const names = imports.get(endpoint.importFrom) ?? new Set<string>()
    names.add(endpoint.importName)
    imports.set(endpoint.importFrom, names)
  }
  addEndpointImport(from)
  addEndpointImport(to)

  const options = [`from: ${from.importName}`, `to: ${to.importName}`]
  if (policy === 'throw') {
    options.push(`onUnsupportedToken: 'throw'`)
  }
  else if (policy === 'drop') {
    imports.get('rosetta-date')!.add('Unsupported')
    options.push(`onUnsupportedToken: () => Unsupported.drop`)
  }

  const importLines = [...imports]
    .map(([source, names]) => `import { ${[...names].sort().join(', ')} } from '${source}'`)
    .join('\n')

  return `${importLines}\n\nconvert(${JSON.stringify(format)}, { ${options.join(', ')} })`
}
