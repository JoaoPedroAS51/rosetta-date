import type { Dialect, Segment } from './types'
import { resolveSyntax } from './syntax'
import { compile, compileComposites } from './tokenize'

/**
 * Parse a format string written in `dialect` into canonical segments.
 *
 * The dialect's {@link Dialect.syntax} chooses how the input is scanned.
 * Recognized tokens become {@link Segment} fields carrying their canonical
 * symbol, literals are decoded, and unrecognized pieces become `unknown`
 * segments. Composite tokens expand in place to the segments of their
 * sub-patterns.
 *
 * Adjacent literal text and adjacent unknown pieces are coalesced. The renderer
 * then escapes literal text as one run, and an unsupported-token handler receives
 * adjacent unknown input as one segment.
 *
 * `expandComposites` is an internal recursion guard. When `false`, composite
 * spellings are not matched, so composite expansions can contain only atomic
 * tokens.
 */
export function parse(input: string, dialect: Dialect, expandComposites = true): Segment[] {
  const { scan } = resolveSyntax(dialect.syntax)
  const tokens = compile(dialect)
  const composites = expandComposites ? compileComposites(dialect) : []
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

  const pushSegment = (segment: Segment): void => {
    if (segment.kind === 'literal')
      pushLiteral(segment.value)
    else if (segment.kind === 'unknown')
      pushUnknown(segment.value)
    else
      segments.push(segment)
  }

  let index = 0
  while (index < input.length) {
    const piece = scan(input, index, tokens, composites)
    switch (piece.kind) {
      case 'literal':
        pushLiteral(piece.value)
        break
      case 'token':
        segments.push({ kind: 'field', canonical: piece.canonical, raw: piece.token })
        break
      case 'composite':
        for (const segment of parse(piece.expandsTo, dialect, false))
          pushSegment(segment)
        break
      case 'unknown':
        pushUnknown(piece.value)
        break
    }
    index = piece.next
  }

  return segments
}
