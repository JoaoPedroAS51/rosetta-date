import type { CanonicalToken } from './canonical'
import type { Dialect, Library, ResolvedLibrary, Segment } from './types'
import type { UnsupportedTokenInfo, UnsupportedTokenPolicy, UnsupportedTokenReason } from './unsupported'
import { UnsupportedTokenError } from './errors'
import { boundaryFor, escapeLiteral } from './literal'
import { compile as compileRules, mergesAfter } from './tokenize'
import { Unsupported } from './unsupported'

/** A bare dialect renders every token; only a library narrows the set. */
const renderAll = (): true => true

/** Resolve a target inline — no dependency on the library merge logic. */
function resolve(target: Dialect | Library): ResolvedLibrary {
  return 'resolved' in target ? target.resolved : { dialect: target, renders: renderAll }
}

/**
 * A compiled render target. The `canonicals` set tells "the library does not
 * render this token" (`unsupported-by-target`) apart from "the grammar has no
 * such field" (`unmappable`).
 */
interface CompiledTarget {
  /** The dialect tokens are rendered into (a {@link Library} resolves to its dialect). */
  readonly dialect: Dialect
  /**
   * Canonical → the primary renderable spelling. The first spelling the target
   * library renders wins, so dialect tables put the preferred spelling first.
   */
  readonly tokens: ReadonlyMap<CanonicalToken, string>
  /** Every canonical the dialect defines, ignoring library support. */
  readonly canonicals: ReadonlySet<CanonicalToken>
}

/** Compiled once per target object (dialect or library) and cached. */
const cache = new WeakMap<Dialect | Library, CompiledTarget>()

function compileTarget(target: Dialect | Library): CompiledTarget {
  let compiled = cache.get(target)
  if (compiled === undefined) {
    const { dialect, renders } = resolve(target)
    const tokens = new Map<CanonicalToken, string>()
    const canonicals = new Set<CanonicalToken>()
    for (const { token, canonical } of dialect.tokens) {
      canonicals.add(canonical)
      if (tokens.has(canonical))
        continue
      if (renders(token))
        tokens.set(canonical, token)
    }
    compiled = { dialect, tokens, canonicals }
    cache.set(target, compiled)
  }
  return compiled
}

/**
 * Options controlling how a render handles tokens with no clean conversion.
 */
export interface RenderOptions {
  /** The dialect the segments were parsed from (for handler context). */
  readonly from: Dialect
  /** Policy for unrecognized or unmappable tokens. Defaults to `'literalize'`. */
  readonly onUnsupportedToken?: UnsupportedTokenPolicy | undefined
}

/** How an unsupported token resolves into output. */
type Resolution
  = | { readonly kind: 'literal', readonly text: string } // accumulate as literal text
    | { readonly kind: 'emit', readonly text: string, readonly isToken?: boolean } // flush, then output verbatim; `isToken` when the text is itself a clean token
    | { readonly kind: 'drop' } // omit entirely

/**
 * Render canonical segments into a format string for `to`.
 *
 * Literals are escaped minimally; fields become the dialect's primary token for
 * their canonical symbol. A field whose canonical has no token in `to`, or whose
 * spelling the target library does not render, plus any `unknown` segment, is
 * handed to the {@link RenderOptions.onUnsupportedToken} policy — by default
 * escaped as a literal, so its characters can never be silently re-read as a
 * token in the target dialect (e.g. an ISO `T` must not become the epoch token).
 *
 * Adjacent literal output is accumulated and escaped together: escaping pieces
 * separately could emit a stray delimiter between them (e.g. `'L'` + `'T'` would
 * read back as the apostrophe `L'T`, not `LT`).
 *
 * Two adjacent field tokens whose concatenation would re-tokenize differently in
 * the target (e.g. moment `LL` + `LT` → `LLLT`, which reads back as `LLL` + `T`)
 * are separated by the dialect's empty literal (`LL[]LT`). When the dialect has
 * none — a quote-style dialect like LDML, where `''` is an apostrophe, not empty —
 * the second token is routed to the policy as `unrepresentable-adjacency`.
 */
export function render(segments: readonly Segment[], to: Dialect | Library, options?: RenderOptions): string {
  const { dialect, tokens, canonicals } = compileTarget(to)
  const rules = compileRules(dialect)
  const boundary = boundaryFor(dialect.literal)
  let output = ''
  let literal = ''
  // The last field token emitted with nothing after it, or `undefined` when the
  // tail is literal/verbatim text (so the next field cannot merge into it).
  let last: string | undefined

  const flush = (): void => {
    if (literal !== '') {
      output += escapeLiteral(literal, dialect.literal)
      literal = ''
      last = undefined
    }
  }

  const apply = (resolution: Resolution): void => {
    switch (resolution.kind) {
      case 'literal':
        literal += resolution.text
        last = undefined
        break
      case 'emit':
        flush()
        output += resolution.text
        last = resolution.isToken === true ? resolution.text : undefined
        break
      case 'drop':
        break // tail unchanged: a dropped token leaves its neighbours adjacent
    }
  }

  const emitToken = (token: string): void => {
    flush()
    if (last !== undefined && mergesAfter(rules, last, token)) {
      if (boundary !== undefined) {
        output += boundary + token
        last = token
      }
      else {
        // The token converts, but this dialect cannot separate it from `last`.
        apply(resolveUnsupported(token, 'unrepresentable-adjacency', dialect, options, { kind: 'emit', text: token, isToken: true }))
      }
    }
    else {
      output += token
      last = token
    }
  }

  for (const segment of segments) {
    switch (segment.kind) {
      case 'literal':
        literal += segment.value
        last = undefined
        break
      case 'unknown':
        apply(resolveUnsupported(segment.value, 'unrecognized', dialect, options))
        break
      case 'field': {
        const token = tokens.get(segment.canonical)
        if (token === undefined) {
          const reason: UnsupportedTokenReason = canonicals.has(segment.canonical)
            ? 'unsupported-by-target'
            : 'unmappable'
          apply(resolveUnsupported(segment.raw, reason, dialect, options))
        }
        else {
          emitToken(token)
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
  fallback: Resolution = { kind: 'literal', text: token },
): Resolution {
  const policy = options?.onUnsupportedToken

  if (policy === 'throw')
    throw new UnsupportedTokenError(token, reason)

  if (typeof policy === 'function' && options !== undefined) {
    const info: UnsupportedTokenInfo = { reason, from: options.from, to }
    const replacement = policy(token, info)
    if (replacement === Unsupported.drop || replacement === '')
      return { kind: 'drop' }
    if (replacement === undefined || replacement === Unsupported.literalize)
      return fallback
    return { kind: 'emit', text: replacement }
  }

  return fallback
}
