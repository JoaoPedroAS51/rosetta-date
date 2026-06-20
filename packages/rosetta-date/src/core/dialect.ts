import type { Dialect, DirectiveSyntax, TokenRule, TokenSyntax } from './types'
import { assertNever } from './assert'

/** Validate a directive family's marker and that every token spelling carries it. */
function validateDirective(name: string, syntax: DirectiveSyntax, tokens: readonly TokenRule[]): void {
  if (syntax.marker.length === 0)
    throw new Error(`Dialect "${name}" must have a non-empty directive "marker"`)

  for (const { token } of tokens) {
    if (!token.startsWith(syntax.marker)) {
      throw new Error(
        `Dialect "${name}" directive token "${token}" must begin with the marker "${syntax.marker}"`,
      )
    }
  }
}

/** Validate a delimited family's open/close/escape coherence. */
function validateDelimited(name: string, open: string, close: string, escapedDelimiter: string | undefined): void {
  if (open.length === 0 || close.length === 0)
    throw new Error(`Dialect "${name}" must have non-empty literal "open" and "close" delimiters`)

  if (escapedDelimiter !== undefined) {
    if (open !== close) {
      throw new Error(
        `Dialect "${name}" sets an "escapedDelimiter", which only applies to quote-style literals where "open" and "close" match`,
      )
    }
    if (escapedDelimiter.length === 0)
      throw new Error(`Dialect "${name}" has an empty "escapedDelimiter"`)
  }
  else if (open === close) {
    throw new Error(
      `Dialect "${name}" has matching "open"/"close" but no "escapedDelimiter" — a bracketed dialect cannot escape its delimiter, so they must differ`,
    )
  }
}

/** Validate a dialect's tokenization syntax, branching exhaustively on its family. */
function validateSyntax(name: string, syntax: TokenSyntax, tokens: readonly TokenRule[]): void {
  switch (syntax.kind) {
    case 'directive':
      validateDirective(name, syntax, tokens)
      break
    case 'delimited':
      validateDelimited(name, syntax.open, syntax.close, syntax.escapedDelimiter)
      break
    default:
      assertNever(syntax)
  }
}

/**
 * Defines and validates a {@link Dialect}.
 *
 * @remarks
 * Validation catches an incoherent {@link Dialect.syntax}, empty token
 * spellings, and duplicate token spellings at definition time. Aliases are
 * valid: multiple token spellings may map to the same canonical symbol.
 *
 * The returned object is the same object passed in. Define it once and reuse it
 * so compiled token tables can be cached by object identity.
 *
 * @param definition - The dialect data to validate.
 * @returns The same {@link Dialect} object passed as `definition`.
 * @throws {Error} When the syntax is invalid, a token spelling is empty, or a
 * token spelling is listed more than once.
 */
export function defineDialect(definition: Dialect): Dialect {
  const { name, syntax, tokens } = definition

  validateSyntax(name, syntax, tokens)

  const seen = new Set<string>()
  for (const { token } of tokens) {
    if (token === '')
      throw new Error(`Dialect "${name}" has an empty token`)
    if (seen.has(token))
      throw new Error(`Dialect "${name}" defines token "${token}" more than once`)
    seen.add(token)
  }

  return definition
}
