import type { CanonicalToken } from './canonical'
import type { Dialect, Segment } from './types'
import type { UnsupportedTokenPolicy, UnsupportedTokenReason } from './unsupported'
import { UnsupportedTokenError } from './errors'
import { escapeLiteral } from './literal'
import { Unsupported } from './unsupported'

/**
 * Canonical → primary-token lookup for rendering. When several tokens share a
 * canonical symbol, the first one listed wins, so dialect tables put the
 * preferred spelling first. Compiled once per dialect and cached.
 */
const cache = new WeakMap<Dialect, ReadonlyMap<CanonicalToken, string>>()

function compile(dialect: Dialect): ReadonlyMap<CanonicalToken, string> {
  let map = cache.get(dialect)
  if (map === undefined) {
    const built = new Map<CanonicalToken, string>()
    for (const { token, canonical } of dialect.tokens) {
      if (!built.has(canonical))
        built.set(canonical, token)
    }
    map = built
    cache.set(dialect, map)
  }
  return map
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
export function render(segments: readonly Segment[], to: Dialect, options?: RenderOptions): string {
  const tokens = compile(to)
  let output = ''
  let literal = ''

  const flush = (): void => {
    if (literal !== '') {
      output += escapeLiteral(literal, to.literal)
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
        apply(resolveUnsupported(segment.value, 'unrecognized', to, options))
        break
      case 'field': {
        const token = tokens.get(segment.canonical)
        if (token === undefined) {
          apply(resolveUnsupported(segment.raw, 'unmappable', to, options))
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
