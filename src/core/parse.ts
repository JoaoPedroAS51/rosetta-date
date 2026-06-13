import type { Dialect, Segment } from './types'
import { isPatternChar, readLiteral } from './literal'
import { compile, matchToken, runExtendsBeyond } from './tokenize'

/**
 * Parse a format string written in `dialect` into canonical segments.
 *
 * Literals are decoded per the dialect's rules; recognized tokens become
 * {@link Segment} fields carrying their canonical symbol; unrecognized letter
 * runs become `unknown` segments. Adjacent literal text — and adjacent
 * unrecognized runs — are coalesced, so the renderer escapes a literal as one
 * run and an unsupported-token handler sees a maximal run as a single token (a
 * mixed run like `Jb` arrives as one `unknown`, matching how a same-letter run
 * like `JJ` already does).
 */
export function parse(input: string, dialect: Dialect): Segment[] {
  const rules = compile(dialect)
  const segments: Segment[] = []

  const pushLiteral = (value: string): void => {
    if (value === '')
      return
    const last = segments.at(-1)
    if (last?.kind === 'literal')
      segments[segments.length - 1] = { kind: 'literal', value: last.value + value }
    else
      segments.push({ kind: 'literal', value })
  }

  const pushUnknown = (value: string): void => {
    const last = segments.at(-1)
    if (last?.kind === 'unknown')
      segments[segments.length - 1] = { kind: 'unknown', value: last.value + value }
    else
      segments.push({ kind: 'unknown', value })
  }

  let index = 0
  while (index < input.length) {
    const literal = readLiteral(input, index, dialect.literal)
    if (literal !== null) {
      pushLiteral(literal.value)
      index = literal.next
      continue
    }

    const char = input.charAt(index)

    if (!isPatternChar(char)) {
      pushLiteral(char)
      index += 1
      continue
    }

    const match = matchToken(rules, input, index)
    if (match !== undefined && !runExtendsBeyond(match.token, input, index)) {
      segments.push({ kind: 'field', canonical: match.canonical, raw: match.token })
      index += match.token.length
      continue
    }

    // Either nothing matched, or a single-letter-run token only matched a prefix of
    // a longer run the dialect does not define (e.g. `QQQ` when only `Q` exists). A
    // run of one letter is a single token whose length is significant, so consume
    // the whole run as one unrecognized segment — never several shorter tokens.
    let end = index + 1
    while (end < input.length && input.charAt(end) === char)
      end += 1
    pushUnknown(input.slice(index, end))
    index = end
  }

  return segments
}
