import type { CanonicalToken } from './canonical'
import type { Dialect, Segment } from './types'
import { escapeLiteral } from './literal'

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
 * Render canonical segments into a format string for `dialect`.
 *
 * Literals are escaped minimally; fields become the dialect's primary token for
 * their canonical symbol. A field whose canonical symbol has no token in this
 * dialect — or an `unknown` segment — is emitted as an *escaped literal* rather
 * than verbatim, so its characters can never be silently re-read as a token in
 * the target dialect (e.g. an ISO `T` must not become the epoch token). That is
 * the permissive default and the seam where a future unknown-token policy will
 * plug in.
 */
export function render(segments: readonly Segment[], dialect: Dialect): string {
  const tokens = compile(dialect)
  let output = ''

  // Literal text, unrecognized runs, and fields with no target token all become
  // literal output. Accumulate adjacent ones and escape them together: escaping
  // separately could emit a stray delimiter between them (e.g. `'L'` + `'T'`
  // would read as the apostrophe `L'T`, not `LT`).
  let literal = ''
  const flush = (): void => {
    if (literal !== '') {
      output += escapeLiteral(literal, dialect.literal)
      literal = ''
    }
  }

  for (const segment of segments) {
    switch (segment.kind) {
      case 'literal':
        literal += segment.value
        break
      case 'unknown':
        literal += segment.value
        break
      case 'field': {
        const token = tokens.get(segment.canonical)
        if (token === undefined) {
          literal += segment.raw
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
