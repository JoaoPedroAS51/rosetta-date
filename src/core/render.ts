import type { CanonicalToken } from './canonical'
import type { Dialect, Library, Segment } from './types'
import type { UnsupportedTokenPolicy, UnsupportedTokenReason } from './unsupported'
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
   * Canonical → primary *supported* token. When several tokens share a canonical
   * the first listed wins, so dialect tables put the preferred spelling first; a
   * library's `supports` set further filters to spellings it actually renders.
   */
  readonly tokens: ReadonlyMap<CanonicalToken, string>
  /** Every canonical the dialect defines, ignoring library support. */
  readonly canonicals: ReadonlySet<CanonicalToken>
}

/** Compiled once per target object (dialect or library) and cached. */
const cache = new WeakMap<Dialect | Library, CompiledTarget>()

function compile(target: Dialect | Library): CompiledTarget {
  let compiled = cache.get(target)
  if (compiled === undefined) {
    const { dialect, supports } = resolveTarget(target)
    const tokens = new Map<CanonicalToken, string>()
    const canonicals = new Set<CanonicalToken>()
    for (const { token, canonical } of dialect.tokens) {
      canonicals.add(canonical)
      if (supports !== undefined && !supports.has(token))
        continue
      if (!tokens.has(canonical))
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
    | { readonly kind: 'emit', readonly text: string } // flush, then output verbatim
    | { readonly kind: 'drop' } // omit entirely

/**
 * Render canonical segments into a format string for `to`.
 *
 * Literals are escaped minimally; fields become the dialect's primary token for
 * their canonical symbol. A field whose canonical symbol has no token in `to`,
 * or an `unknown` segment, is handed to the {@link RenderOptions.onUnsupportedToken}
 * policy — by default escaped as a literal, so its characters can never be
 * silently re-read as a token in the target dialect (e.g. an ISO `T` must not
 * become the epoch token).
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
        const token = tokens.get(segment.canonical)
        if (token === undefined) {
          const reason: UnsupportedTokenReason = canonicals.has(segment.canonical)
            ? 'unsupported-by-target'
            : 'unmappable'
          apply(resolveUnsupported(segment.raw, reason, dialect, options))
        }
        else {
          flush()
          output += token
        }
        break
      }
    }
  }

  flush()
  return output
}

function resolveUnsupported(token: string, reason: UnsupportedTokenReason, to: Dialect, options?: RenderOptions): Resolution {
  const policy = options?.onUnsupportedToken

  if (policy === 'throw')
    throw new UnsupportedTokenError(token, reason)

  if (typeof policy === 'function' && options !== undefined) {
    const replacement = policy(token, { reason, from: options.from, to })
    if (replacement === Unsupported.drop || replacement === '')
      return { kind: 'drop' }
    if (replacement === undefined || replacement === Unsupported.literalize)
      return { kind: 'literal', text: token }
    return { kind: 'emit', text: replacement }
  }

  return { kind: 'literal', text: token }
}
