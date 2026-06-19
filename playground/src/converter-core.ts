import type { UnsupportedTokenPolicy, UnsupportedTokenReason } from 'rosetta-date'
import type { Endpoint } from './endpoints'
import { convert, Unsupported, UnsupportedTokenError } from 'rosetta-date'

export type PolicyChoice = 'literalize' | 'throw' | 'drop'

export interface UnsupportedHit {
  readonly token: string
  readonly reason: UnsupportedTokenReason
}

export interface ConvertOutcome {
  readonly ok: boolean
  readonly output: string
  readonly errorMessage?: string
  /** Every token with no clean conversion, gathered regardless of the active policy. */
  readonly unsupported: readonly UnsupportedHit[]
}

/** Human-readable, one-line explanation for each unsupported reason. */
export const reasonText: Record<UnsupportedTokenReason, string> = {
  'unrecognized': 'the source grammar does not define this token',
  'unmappable': 'a valid source field with no counterpart in the target grammar',
  'unsupported-by-target': 'the target grammar has the field, but the target library cannot render it',
  'unrepresentable-adjacency': 'converts fine, but would re-merge with its neighbour and the target has no empty literal to separate them',
}

function policyValue(policy: PolicyChoice): UnsupportedTokenPolicy {
  if (policy === 'drop')
    return () => Unsupported.drop
  return policy
}

/**
 * Run a conversion and, in the same call, surface every token that had no clean
 * conversion. The breakdown is gathered with a collector pass (always under
 * `literalize`, so it never stops early), independent of the policy the user
 * picked for the visible result.
 */
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
    // A non-token parse failure surfaces below through the result pass.
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

/**
 * Whether converting `from → to` and back reproduces the input verbatim. Returns
 * `null` when either leg cannot be computed.
 */
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

/** Generate the equivalent `convert(...)` call as copy-pasteable source. */
export function toSnippet(from: Endpoint, to: Endpoint, format: string, policy: PolicyChoice): string {
  const imports = new Map<string, Set<string>>([['rosetta-date', new Set(['convert'])]])
  const add = (endpoint: Endpoint): void => {
    const set = imports.get(endpoint.importFrom) ?? new Set<string>()
    set.add(endpoint.importName)
    imports.set(endpoint.importFrom, set)
  }
  add(from)
  add(to)

  const opts = [`from: ${from.importName}`, `to: ${to.importName}`]
  if (policy === 'throw') {
    opts.push(`onUnsupportedToken: 'throw'`)
  }
  else if (policy === 'drop') {
    imports.get('rosetta-date')!.add('Unsupported')
    opts.push(`onUnsupportedToken: () => Unsupported.drop`)
  }

  const importLines = [...imports]
    .map(([source, names]) => `import { ${[...names].sort().join(', ')} } from '${source}'`)
    .join('\n')

  return `${importLines}\n\nconvert(${JSON.stringify(format)}, { ${opts.join(', ')} })`
}
