import type { CanonicalToken } from './canonical'
import type { Dialect, TokenRule } from './types'

/**
 * Token rows sorted longest-first so matching is greedy (`YYYY` before `YY`
 * before `Y`). Compiled once per dialect and cached, since dialects are
 * immutable.
 */
const cache = new WeakMap<Dialect, readonly TokenRule[]>()

export function compile(dialect: Dialect): readonly TokenRule[] {
  let sorted = cache.get(dialect)
  if (sorted === undefined) {
    sorted = [...dialect.tokens].sort((a, b) => b.token.length - a.token.length)
    cache.set(dialect, sorted)
  }
  return sorted
}

/** The first token (longest-first) whose spelling begins at `index`, if any. */
export function matchToken(tokens: readonly TokenRule[], input: string, index: number): { token: string, canonical: CanonicalToken } | undefined {
  for (const rule of tokens) {
    if (input.startsWith(rule.token, index))
      return rule
  }
  return undefined
}
