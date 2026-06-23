import type { DelimitedSyntax, TokenRule } from '../types'
import type { Scan, SyntaxStrategy } from './strategy'
import { matchToken } from '../tokenize'

/** Result of reading a literal run from a format string. */
interface LiteralRead {
  /** The decoded literal text (delimiters and escapes already resolved). */
  readonly value: string
  /** Index just past the consumed literal in the source string. */
  readonly next: number
}

/**
 * The delimited family reserves ASCII letters as pattern (token) characters;
 * everything else is literal. This single rule drives literal detection in the
 * scanner and minimal escaping in the renderer.
 */
function isPatternChar(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}

/**
 * Try to read a literal run starting at `start`. Returns `null` when no literal
 * begins there. Branches on the delimiter model:
 *
 * - **Quoted** (`escapedDelimiter` set): a doubled
 *   delimiter is one literal delimiter; a lone delimiter opens a run that ends at
 *   the next lone delimiter. An unterminated run is read to end of input.
 * - **Bracketed** (no `escapedDelimiter`): text up to the closing delimiter is
 *   literal. An unterminated opening delimiter is not a literal, so this returns
 *   `null` and lets the scanner handle it as ordinary text.
 */
function readLiteral(input: string, start: number, rules: DelimitedSyntax): LiteralRead | null {
  const { open, close, escapedDelimiter } = rules

  if (escapedDelimiter !== undefined) {
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
 * The empty literal: the zero-width sequence the family's own scanner consumes
 * as nothing, used to separate two adjacent tokens that would otherwise re-merge
 * (for example, `LL` + `LT` as `LL[]LT`). It is `open + close`, unless that
 * collides with `escapedDelimiter` and does not read as empty. In that case
 * there is no boundary.
 */
function boundaryFor(rules: DelimitedSyntax): string | undefined {
  const empty = rules.open + rules.close
  return empty === rules.escapedDelimiter ? undefined : empty
}

/**
 * Encode literal text, escaping only what must be escaped. Only the span from
 * the first letter to the last is wrapped in the dialect's delimiters. Leading
 * and trailing punctuation stays raw, so `dd/MM` stays `dd/MM` and ` o'clock`
 * becomes ` [o'clock]`. Quoted dialects double embedded delimiters; bracketed
 * dialects split the span around any bare `close` character.
 */
function escapeLiteral(value: string, rules: DelimitedSyntax): string {
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

  if (first === -1)
    return escape(value)

  const lead = escape(value.slice(0, first))
  const core = wrapSpan(value.slice(first, last + 1))
  const trail = escape(value.slice(last + 1))
  return lead + core + trail
}

/**
 * True when `token` is a run of one repeated letter and the input continues with
 * that same letter. The match is only part of a longer same-letter run the
 * dialect does not define, so the whole run is one unrecognized token.
 */
function runExtendsBeyond(token: string, input: string, index: number): boolean {
  const first = token.charAt(0)
  for (let i = 1; i < token.length; i += 1) {
    if (token.charAt(i) !== first)
      return false
  }
  return input.charAt(index + token.length) === first
}

/**
 * Whether emitting `cur` immediately after `prev` would re-tokenize wrongly: the
 * greedy matcher must consume exactly `prev` at the junction, then `cur` follows
 * cleanly. Both are dialect tokens, so the junction match is at least
 * `prev.length`; it is safe iff it is *exactly* `prev` and the run does not
 * extend past it (e.g. `YY` + `Y` → `YYY`, an over-long run).
 */
function mergesAfter(tokens: readonly TokenRule[], prev: string, cur: string): boolean {
  const combined = prev + cur
  const match = matchToken(tokens, combined, 0)
  return !(
    match !== undefined
    && match.token.length === prev.length
    && !runExtendsBeyond(match.token, combined, 0)
  )
}

/** Build the strategy for a {@link DelimitedSyntax} dialect. */
export function delimitedStrategy(config: DelimitedSyntax): SyntaxStrategy {
  const boundary = boundaryFor(config)

  return {
    scan(input, index, tokens, composites): Scan {
      const literal = readLiteral(input, index, config)
      if (literal !== null)
        return { kind: 'literal', value: literal.value, next: literal.next }

      const char = input.charAt(index)
      if (!isPatternChar(char))
        return { kind: 'literal', value: char, next: index + 1 }

      const match = matchToken(tokens, input, index)
      if (match !== undefined && !runExtendsBeyond(match.token, input, index))
        return { kind: 'token', token: match.token, canonical: match.canonical, next: index + match.token.length }

      const composite = matchToken(composites, input, index)
      if (composite !== undefined && !runExtendsBeyond(composite.token, input, index))
        return { kind: 'composite', token: composite.token, expandsTo: composite.expandsTo, next: index + composite.token.length }

      // A single-letter-run token that only matched a prefix of a longer run the
      // dialect does not define: consume the whole run as one unrecognized token.
      let end = index + 1
      while (end < input.length && input.charAt(end) === char)
        end += 1
      return { kind: 'unknown', value: input.slice(index, end), next: end }
    },

    escapeLiteral(value) {
      return escapeLiteral(value, config)
    },

    separator(prev, cur, tokens) {
      return mergesAfter(tokens, prev, cur) ? boundary : ''
    },
  }
}
