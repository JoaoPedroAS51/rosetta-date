import type { CompositeRule, Dialect, TokenRule } from './types'

const tokenCache = new WeakMap<Dialect, readonly TokenRule[]>()
const compositeCache = new WeakMap<Dialect, readonly CompositeRule[]>()

/** Sort spellings longest-first so matching is greedy (`YYYY` before `YY` before `Y`). */
function byLengthDesc<T extends { token: string }>(rules: readonly T[]): readonly T[] {
  return [...rules].sort((a, b) => b.token.length - a.token.length)
}

/**
 * The dialect's token rules, longest-first. Compiled once per dialect and cached,
 * since dialects are immutable.
 */
export function compile(dialect: Dialect): readonly TokenRule[] {
  let sorted = tokenCache.get(dialect)
  if (sorted === undefined) {
    sorted = byLengthDesc(dialect.tokens)
    tokenCache.set(dialect, sorted)
  }
  return sorted
}

/** The dialect's composite rules, longest-first. Cached like {@link compile}. */
export function compileComposites(dialect: Dialect): readonly CompositeRule[] {
  let sorted = compositeCache.get(dialect)
  if (sorted === undefined) {
    sorted = byLengthDesc(dialect.composites ?? [])
    compositeCache.set(dialect, sorted)
  }
  return sorted
}

/** The first rule (longest-first) whose spelling begins at `index`, if any. */
export function matchToken<T extends { token: string }>(rules: readonly T[], input: string, index: number): T | undefined {
  for (const rule of rules) {
    if (input.startsWith(rule.token, index))
      return rule
  }
  return undefined
}
