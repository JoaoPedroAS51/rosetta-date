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
export function matchToken(rules: readonly TokenRule[], input: string, index: number): { token: string, canonical: CanonicalToken } | undefined {
  for (const rule of rules) {
    if (input.startsWith(rule.token, index))
      return rule
  }
  return undefined
}

/**
 * True when `token` is a run of one repeated letter and the input continues with
 * that same letter — meaning the match is only part of a longer same-letter run
 * the dialect does not define, so the whole run is one unrecognized token.
 */
export function runExtendsBeyond(token: string, input: string, index: number): boolean {
  const first = token.charAt(0)
  for (let i = 1; i < token.length; i += 1) {
    if (token.charAt(i) !== first)
      return false
  }
  return input.charAt(index + token.length) === first
}

/**
 * Whether emitting `cur` immediately after `prev` (two adjacent field tokens,
 * nothing between) would re-tokenize wrongly in a dialect with these `rules`:
 * the greedy matcher must consume exactly `prev` at the junction, then `cur`
 * follows cleanly. Since both are dialect tokens, the junction match is always at
 * least `prev.length`, so it is safe iff it is *exactly* `prev` and the run does
 * not extend past it (e.g. `YY` + `Y` → `YYY`, an over-long run).
 */
export function mergesAfter(rules: readonly TokenRule[], prev: string, cur: string): boolean {
  const combined = prev + cur
  const match = matchToken(rules, combined, 0)
  return !(
    match !== undefined
    && match.token.length === prev.length
    && !runExtendsBeyond(match.token, combined, 0)
  )
}
