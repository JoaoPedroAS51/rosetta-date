import type { CompositeRule, Dialect, DirectiveSyntax, TokenRule, TokenSyntax } from './types'
import { assertNever } from './assert'
import { parse } from './parse'

function validateDirective(name: string, syntax: DirectiveSyntax, tokens: readonly TokenRule[], composites: readonly CompositeRule[]): void {
  if (syntax.marker.length === 0)
    throw new Error(`Dialect "${name}" must have a non-empty directive "marker"`)

  for (const { token } of [...tokens, ...composites]) {
    if (!token.startsWith(syntax.marker)) {
      throw new Error(
        `Dialect "${name}" directive token "${token}" must begin with the marker "${syntax.marker}"`,
      )
    }
  }
}

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
      `Dialect "${name}" has matching "open"/"close" but no "escapedDelimiter". A bracketed dialect cannot escape its delimiter, so they must differ`,
    )
  }
}

function validateSyntax(name: string, syntax: TokenSyntax, tokens: readonly TokenRule[], composites: readonly CompositeRule[]): void {
  switch (syntax.kind) {
    case 'directive':
      validateDirective(name, syntax, tokens, composites)
      break
    case 'delimited':
      validateDelimited(name, syntax.open, syntax.close, syntax.escapedDelimiter)
      break
    default:
      assertNever(syntax)
  }
}

function validateComposites(definition: Dialect, tokens: readonly TokenRule[], composites: readonly CompositeRule[]): void {
  const spellings = new Set(tokens.map(rule => rule.token))
  const seen = new Set<string>()
  for (const { token, expandsTo } of composites) {
    if (token === '')
      throw new Error(`Dialect "${definition.name}" has an empty composite token`)
    if (spellings.has(token))
      throw new Error(`Dialect "${definition.name}" composite "${token}" collides with a token of the same spelling`)
    if (seen.has(token))
      throw new Error(`Dialect "${definition.name}" defines composite "${token}" more than once`)
    seen.add(token)
    if (expandsTo === '')
      throw new Error(`Dialect "${definition.name}" composite "${token}" has an empty expansion`)
    if (parse(expandsTo, definition, false).some(segment => segment.kind === 'unknown'))
      throw new Error(`Dialect "${definition.name}" composite "${token}" expands to "${expandsTo}", which has unrecognized tokens`)
  }
}

/**
 * Validate and return a {@link Dialect}.
 *
 * @param definition - The dialect data to validate.
 * @returns The same {@link Dialect} object passed as `definition`.
 * @throws {Error} When syntax, token spellings, or composite rules are invalid.
 */
export function defineDialect(definition: Dialect): Dialect {
  const { name, syntax, tokens, composites = [] } = definition

  validateSyntax(name, syntax, tokens, composites)

  const seen = new Set<string>()
  for (const { token } of tokens) {
    if (token === '')
      throw new Error(`Dialect "${name}" has an empty token`)
    if (seen.has(token))
      throw new Error(`Dialect "${name}" defines token "${token}" more than once`)
    seen.add(token)
  }

  validateComposites(definition, tokens, composites)

  return definition
}
