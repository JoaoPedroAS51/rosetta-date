import type { CanonicalToken } from './canonical'
import type { Dialect, Library, Segment, TokenCapability } from './types'
import type { UnsupportedTokenInfo, UnsupportedTokenPolicy, UnsupportedTokenReason } from './unsupported'
import { UnsupportedTokenError } from './errors'
import { resolveTarget } from './library'
import { escapeLiteral } from './literal'
import { Unsupported } from './unsupported'

/**
 * A compiled render target. The `canonicals` set tells "the library does not
 * render this token" (`unsupported-by-target`) apart from "the grammar has no
 * such field" (`unmappable`).
 */
interface CompiledTarget {
  /** The dialect tokens are rendered into (a {@link Library} resolves to its dialect). */
  readonly dialect: Dialect
  /**
   * Canonical → the primary renderable spelling and the condition (if any) under
   * which the target renders it. The first non-absent spelling listed wins, so
   * dialect tables put the preferred spelling first.
   */
  readonly tokens: ReadonlyMap<CanonicalToken, { readonly token: string, readonly capability: TokenCapability }>
  /** Every canonical the dialect defines, ignoring library support. */
  readonly canonicals: ReadonlySet<CanonicalToken>
}

/** Compiled once per target object (dialect or library) and cached. */
const cache = new WeakMap<Dialect | Library, CompiledTarget>()

function compile(target: Dialect | Library): CompiledTarget {
  let compiled = cache.get(target)
  if (compiled === undefined) {
    const { dialect, capability } = resolveTarget(target)
    const tokens = new Map<CanonicalToken, { token: string, capability: TokenCapability }>()
    const canonicals = new Set<CanonicalToken>()
    for (const { token, canonical } of dialect.tokens) {
      canonicals.add(canonical)
      if (tokens.has(canonical))
        continue
      const cap = capability(token)
      if (cap !== undefined)
        tokens.set(canonical, { token, capability: cap })
    }
    compiled = { dialect, tokens, canonicals }
    cache.set(target, compiled)
  }
  return compiled
}

/**
 * Conditions the caller guarantees the *target* library has — which plugins,
 * options, or environment features are loaded. A token whose capability needs a
 * condition not listed here is routed through `onUnsupportedToken`. Omitting
 * `assume` entirely is optimistic: every declared condition is treated as met.
 * Providing it switches off that optimism for **every** kind — an omitted (or
 * empty) list means no condition of that kind is met, so `{ plugins: ['x'] }`
 * still flags every flag- and env-gated token.
 */
export interface Assume {
  readonly plugins?: readonly string[]
  readonly flags?: readonly string[]
  readonly env?: readonly string[]
}

/**
 * Options controlling how a render handles tokens with no clean conversion.
 */
export interface RenderOptions {
  /** The dialect the segments were parsed from (for handler context). */
  readonly from: Dialect
  /** Policy for unrecognized, unmappable, or condition-gated tokens. Defaults to `'literalize'`. */
  readonly onUnsupportedToken?: UnsupportedTokenPolicy | undefined
  /** Which of the target library's conditions (plugins/flags/env) the caller has. */
  readonly assume?: Assume | undefined
}

function contains(list: readonly string[] | undefined, value: string): boolean {
  return list !== undefined && list.includes(value)
}

/** Whether the target renders a token of this capability given `assume`, else why not. */
function availability(
  capability: TokenCapability,
  assume: Assume | undefined,
): true | { readonly reason: UnsupportedTokenReason, readonly requires: string } {
  if (capability === 'supported' || assume === undefined)
    return true
  if ('plugin' in capability)
    return contains(assume.plugins, capability.plugin) ? true : { reason: 'requires-plugin', requires: capability.plugin }
  if ('flag' in capability)
    return contains(assume.flags, capability.flag) ? true : { reason: 'requires-flag', requires: capability.flag }
  return contains(assume.env, capability.env) ? true : { reason: 'requires-env', requires: capability.env }
}

/** How an unsupported token resolves into output. */
type Resolution
  = | { readonly kind: 'literal', readonly text: string } // accumulate as literal text
    | { readonly kind: 'emit', readonly text: string } // flush, then output verbatim
    | { readonly kind: 'drop' } // omit entirely

/**
 * Render canonical segments into a format string for `to`.
 *
 * Literals are escaped minimally; fields become the dialect's primary token for
 * their canonical symbol. A field whose canonical has no token in `to`, whose
 * spelling the target library does not render, or whose capability needs a
 * condition not in `assume`, plus any `unknown` segment, is handed to the
 * {@link RenderOptions.onUnsupportedToken} policy — by default escaped as a
 * literal, so its characters can never be silently re-read as a token in the
 * target dialect (e.g. an ISO `T` must not become the epoch token).
 *
 * Adjacent literal output is accumulated and escaped together: escaping pieces
 * separately could emit a stray delimiter between them (e.g. `'L'` + `'T'` would
 * read back as the apostrophe `L'T`, not `LT`).
 */
export function render(segments: readonly Segment[], to: Dialect | Library, options?: RenderOptions): string {
  const { dialect, tokens, canonicals } = compile(to)
  let output = ''
  let literal = ''

  const flush = (): void => {
    if (literal !== '') {
      output += escapeLiteral(literal, dialect.literal)
      literal = ''
    }
  }

  const apply = (resolution: Resolution): void => {
    switch (resolution.kind) {
      case 'literal':
        literal += resolution.text
        break
      case 'emit':
        flush()
        output += resolution.text
        break
      case 'drop':
        break
    }
  }

  for (const segment of segments) {
    switch (segment.kind) {
      case 'literal':
        literal += segment.value
        break
      case 'unknown':
        apply(resolveUnsupported(segment.value, 'unrecognized', dialect, options))
        break
      case 'field': {
        const entry = tokens.get(segment.canonical)
        if (entry === undefined) {
          const reason: UnsupportedTokenReason = canonicals.has(segment.canonical)
            ? 'unsupported-by-target'
            : 'unmappable'
          apply(resolveUnsupported(segment.raw, reason, dialect, options))
        }
        else {
          const avail = availability(entry.capability, options?.assume)
          if (avail === true) {
            flush()
            output += entry.token
          }
          else {
            apply(resolveUnsupported(segment.raw, avail.reason, dialect, options, avail.requires))
          }
        }
        break
      }
    }
  }

  flush()
  return output
}

function resolveUnsupported(
  token: string,
  reason: UnsupportedTokenReason,
  to: Dialect,
  options?: RenderOptions,
  requires?: string,
): Resolution {
  const policy = options?.onUnsupportedToken

  if (policy === 'throw')
    throw new UnsupportedTokenError(token, reason, requires)

  if (typeof policy === 'function' && options !== undefined) {
    const info: UnsupportedTokenInfo = { reason, from: options.from, to, ...(requires !== undefined ? { requires } : {}) }
    const replacement = policy(token, info)
    if (replacement === Unsupported.drop || replacement === '')
      return { kind: 'drop' }
    if (replacement === undefined || replacement === Unsupported.literalize)
      return { kind: 'literal', text: token }
    return { kind: 'emit', text: replacement }
  }

  return { kind: 'literal', text: token }
}
