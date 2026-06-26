import type { CanonicalToken } from './canonical'
import type { Dialect, Library, ResolvedLibrary, Segment } from './types'
import type { UnsupportedTokenInfo, UnsupportedTokenPolicy, UnsupportedTokenReason } from './unsupported'
import { UnsupportedTokenError } from './errors'
import { resolveSyntax } from './syntax'
import { compile as compileRules } from './tokenize'
import { Unsupported } from './unsupported'

/** A bare dialect renders every token; only a library narrows the set. */
const renderAll = (): true => true

/** Resolve a target inline — no dependency on the library merge logic. */
function resolve(target: Dialect | Library): ResolvedLibrary {
  return 'resolved' in target ? target.resolved : { dialect: target, renders: renderAll }
}

/**
 * A compiled render target. The `canonicals` set tells "the library does not
 * render this canonical field" (`unsupported-by-target`) apart from "the
 * grammar has no such field" (`unmappable`).
 */
interface CompiledTarget {
  /** The dialect tokens are rendered into (a {@link Library} resolves to its dialect). */
  readonly dialect: Dialect
  /** Canonical -> target token spelling. */
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
      if (renders(canonical))
        tokens.set(canonical, token)
    }
    compiled = { dialect, tokens, canonicals }
    cache.set(target, compiled)
  }
  return compiled
}

/**
 * Returns the canonical fields a target renders, mapped to a target token
 * spelling.
 *
 * @param target - The dialect or library to inspect.
 * @returns A map from canonical field to target token spelling.
 *
 * @internal
 */
export function renderedTokens(target: Dialect | Library): ReadonlyMap<CanonicalToken, string> {
  return compileTarget(target).tokens
}

/**
 * Options controlling how a render handles tokens with no clean conversion.
 */
export interface RenderOptions {
  /** The dialect the segments were parsed from (for handler context). */
  readonly from: Dialect
  /** The source endpoint when it was a `Library`, surfaced to the handler as `info.fromLibrary`. */
  readonly fromLibrary?: Library | undefined
  /** Policy for unrecognized or unmappable tokens. Defaults to `'literalize'`. */
  readonly onUnsupportedToken?: UnsupportedTokenPolicy | undefined
}

/** How an unsupported token resolves into output. */
type Resolution
  = | { readonly kind: 'literal', readonly text: string } // accumulate as literal text
    | { readonly kind: 'emit', readonly text: string } // flush, then output verbatim
    | { readonly kind: 'drop' } // omit entirely

/**
 * Render canonical segments into a format string for `to`.
 *
 * Literals are escaped minimally; fields become target tokens for their
 * canonical symbols. A field whose canonical has no token in `to`, or whose
 * canonical field the target library does not render, plus any `unknown`
 * segment, is handed to the {@link RenderOptions.onUnsupportedToken} policy. By
 * default, it is escaped as a literal, so its characters can never be silently
 * re-read as a token in the target dialect (e.g. an ISO `T` must not become the
 * epoch token).
 *
 * Adjacent literal output is accumulated and escaped together: escaping pieces
 * separately could emit a stray delimiter between them (e.g. `'L'` + `'T'` would
 * read back as the apostrophe `L'T`, not `LT`).
 *
 * Some syntax families need a separator between adjacent tokens so the output
 * does not re-tokenize as a different token. The target syntax provides that
 * separator. When it cannot, the second token is routed to the policy as
 * `unrepresentable-adjacency`, literalized by default like any other unsupported
 * token.
 */
export function render(segments: readonly Segment[], to: Dialect | Library, options?: RenderOptions): string {
  const { dialect, tokens, canonicals } = compileTarget(to)
  const toLibrary = 'resolved' in to ? to : undefined
  const strategy = resolveSyntax(dialect.syntax)
  const rules = compileRules(dialect)
  let output = ''
  let literal = ''
  // The last field token emitted with nothing after it, or `undefined` when the
  // tail is literal text, so the next field cannot merge into it.
  let last: string | undefined

  const flush = (): void => {
    if (literal !== '') {
      output += strategy.escapeLiteral(literal)
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
        last = undefined
        break
      case 'drop':
        break // tail unchanged: a dropped token leaves its neighbours adjacent
    }
  }

  const emitToken = (token: string): void => {
    flush()
    if (last !== undefined) {
      const separator = strategy.separator(last, token, rules)
      if (separator === undefined) {
        // The token converts, but this dialect cannot separate it from `last`, so
        // it routes to the policy like any other unrenderable token — literalized
        // by default, never emitted into a silently merged token.
        apply(resolveUnsupported(token, 'unrepresentable-adjacency', dialect, toLibrary, options))
        return
      }
      output += separator + token
      last = token
      return
    }
    output += token
    last = token
  }

  for (const segment of segments) {
    switch (segment.kind) {
      case 'literal':
        literal += segment.value
        last = undefined
        break
      case 'unknown':
        apply(resolveUnsupported(segment.value, 'unrecognized', dialect, toLibrary, options))
        break
      case 'field': {
        const token = tokens.get(segment.canonical)
        if (token === undefined) {
          const reason: UnsupportedTokenReason = canonicals.has(segment.canonical)
            ? 'unsupported-by-target'
            : 'unmappable'
          apply(resolveUnsupported(segment.raw, reason, dialect, toLibrary, options))
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
  toLibrary: Library | undefined,
  options?: RenderOptions,
): Resolution {
  const policy = options?.onUnsupportedToken

  if (policy === 'throw')
    throw new UnsupportedTokenError(token, reason)

  const fallback: Resolution = { kind: 'literal', text: token }

  if (typeof policy === 'function' && options !== undefined) {
    const info: UnsupportedTokenInfo = { reason, from: options.from, to, fromLibrary: options.fromLibrary, toLibrary }
    const replacement = policy(token, info)
    if (replacement === Unsupported.drop || replacement === '')
      return { kind: 'drop' }
    if (replacement === undefined || replacement === Unsupported.literalize)
      return fallback
    return { kind: 'emit', text: replacement }
  }

  return fallback
}
