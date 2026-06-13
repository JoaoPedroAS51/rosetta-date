import type { LiteralRules } from './types'

/**
 * Result of reading a literal run from a format string.
 */
interface LiteralRead {
  /** The decoded literal text (delimiters and escapes already resolved). */
  readonly value: string
  /** Index just past the consumed literal in the source string. */
  readonly next: number
}

/**
 * Both moment and ldml reserve ASCII letters as pattern (token) characters;
 * everything else is literal. This single rule drives literal detection in the
 * parser and minimal escaping in the renderer.
 */
export function isPatternChar(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}

/**
 * Try to read a literal run starting at `start`. Returns `null` when no literal
 * begins there (so the caller can treat the character as ordinary input). The
 * algorithm branches on the dialect family:
 *
 * - **Quoted** (`escapedDelimiter` set, e.g. LDML `'…'` with `''`): a doubled
 *   delimiter is one literal delimiter; a lone delimiter opens a run that ends
 *   at the next lone delimiter. An unterminated run is read to end of input
 *   (best-effort, permissive).
 * - **Bracketed** (no `escapedDelimiter`, e.g. moment `[…]`): text up to the
 *   closing delimiter is literal. An unterminated `[` is *not* a literal — we
 *   return `null` so it falls through as an ordinary literal character.
 */
export function readLiteral(input: string, start: number, rules: LiteralRules): LiteralRead | null {
  const { open, close, escapedDelimiter } = rules

  if (escapedDelimiter !== undefined) {
    // A doubled delimiter is a single literal delimiter, even outside a run.
    if (input.startsWith(escapedDelimiter, start))
      return { value: open, next: start + escapedDelimiter.length }

    if (!input.startsWith(open, start))
      return null

    let cursor = start + open.length
    let value = ''
    while (cursor < input.length) {
      if (input.startsWith(escapedDelimiter, cursor)) {
        value += open
        cursor += escapedDelimiter.length
        continue
      }
      if (input.startsWith(close, cursor))
        return { value, next: cursor + close.length }
      value += input[cursor]
      cursor += 1
    }
    return { value, next: cursor }
  }

  if (!input.startsWith(open, start))
    return null

  const closeIndex = input.indexOf(close, start + open.length)
  if (closeIndex === -1)
    return null

  return {
    value: input.slice(start + open.length, closeIndex),
    next: closeIndex + close.length,
  }
}

/**
 * The dialect's empty literal — the zero-width sequence its own parser consumes
 * as nothing, used to separate two adjacent tokens that would otherwise re-merge
 * (e.g. moment `LL` + `LT` → `LL[]LT`). It is `open + close`, *unless* that
 * collides with `escapedDelimiter` and so does not read as empty: LDML's `''` is
 * a literal apostrophe, not an empty run, so quoted dialects have no boundary and
 * this returns `undefined`.
 *
 * This assumes `open + close` parses as an empty literal whenever it differs from
 * the escape — true for the bracket and quote families. A dialect that breaks the
 * assumption would need an explicit boundary; none does today.
 */
export function boundaryFor(rules: LiteralRules): string | undefined {
  const empty = rules.open + rules.close
  return empty === rules.escapedDelimiter ? undefined : empty
}

/**
 * Encode literal text for a target dialect, escaping only what must be escaped.
 *
 * Only the span from the first letter to the last letter is wrapped in the
 * dialect's delimiters — leading and trailing punctuation/whitespace stays raw,
 * so `dd/MM` stays `dd/MM` (never `dd'/'MM`) and ` o'clock` becomes ` [o'clock]`
 * rather than `[ o'clock]`. For quoted dialects, embedded delimiters are doubled.
 *
 * A bracketed dialect has no in-band escape for its `close` delimiter, so a
 * `close` character can never sit inside a pair: the wrapped span is split around
 * each one, which is emitted raw between the bracketed pieces (a bare `]` already
 * reads as a literal in moment). This keeps a literal `]` intact rather than
 * swallowing it — `a]b` → `[a]][b]`. It assumes `open` and `close` differ, which
 * every bracketed dialect satisfies.
 */
export function escapeLiteral(value: string, rules: LiteralRules): string {
  if (value === '')
    return ''

  const { open, close, escapedDelimiter } = rules
  const isQuoted = escapedDelimiter !== undefined
  const escape = (text: string): string => isQuoted ? text.replaceAll(open, escapedDelimiter) : text
  const wrapSpan = (span: string): string =>
    isQuoted
      ? open + escape(span) + close
      : span.split(close).map(part => (part === '' ? '' : open + part + close)).join(close)

  let first = -1
  let last = -1
  for (let i = 0; i < value.length; i += 1) {
    if (isPatternChar(value.charAt(i))) {
      if (first === -1)
        first = i
      last = i
    }
  }

  // No letters: nothing can be mistaken for a token, so emit raw (with any
  // delimiter characters escaped for quoted dialects).
  if (first === -1)
    return escape(value)

  const lead = escape(value.slice(0, first))
  const core = wrapSpan(value.slice(first, last + 1))
  const trail = escape(value.slice(last + 1))
  return lead + core + trail
}
