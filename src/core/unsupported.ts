import type { Dialect } from './types'

const drop = Symbol('rosetta-date/unsupported.drop')
const literalize = Symbol('rosetta-date/unsupported.literalize')

/**
 * Explicit return sentinels for an {@link UnsupportedTokenHandler}, so intent is
 * readable at the call site instead of relying on `''` vs `undefined`:
 *
 * - `Unsupported.drop` — omit the token entirely.
 * - `Unsupported.literalize` — defer to the default behaviour (escape it as a
 *   literal).
 *
 * @example
 * ```ts
 * onUnsupportedToken: (token, info) =>
 *   info.reason === 'unmappable' ? Unsupported.drop : Unsupported.literalize
 * ```
 */
export const Unsupported = { drop, literalize } as const

/**
 * Why a token cannot be converted cleanly:
 * - `'unrecognized'` — the source dialect does not define this token.
 * - `'unmappable'` — a valid source field with no token in the target dialect.
 */
export type UnsupportedTokenReason = 'unrecognized' | 'unmappable'

/**
 * Context passed to an {@link UnsupportedTokenHandler} alongside the offending
 * token.
 */
export interface UnsupportedTokenInfo {
  /** Why the token could not be converted. */
  readonly reason: UnsupportedTokenReason
  /** The dialect the format was parsed from. */
  readonly from: Dialect
  /** The dialect being rendered to. */
  readonly to: Dialect
}

/**
 * What an {@link UnsupportedTokenHandler} may return:
 * - a `string` — emitted verbatim (an empty string emits nothing).
 * - {@link Unsupported.drop} — omit the token.
 * - {@link Unsupported.literalize} — use the default (escape it as a literal).
 */
export type UnsupportedTokenResult = string | typeof Unsupported.drop | typeof Unsupported.literalize

/**
 * Decides what to emit for a token with no clean conversion. Returning
 * `undefined` (e.g. from a handler that simply falls through) is treated as
 * {@link Unsupported.literalize}.
 */
export type UnsupportedTokenHandler = (token: string, info: UnsupportedTokenInfo) => UnsupportedTokenResult | undefined

/**
 * What to do with a token that has no clean conversion:
 * - `'literalize'` (default) — emit it as an escaped literal.
 * - `'throw'` — throw an `UnsupportedTokenError`.
 * - a {@link UnsupportedTokenHandler} — decide per token.
 */
export type UnsupportedTokenPolicy = 'literalize' | 'throw' | UnsupportedTokenHandler
