import type { Dialect } from './types'

/**
 * Defines and validates a {@link Dialect}.
 *
 * @remarks
 * Validation catches incoherent literal rules, empty token spellings, and
 * duplicate token spellings at definition time. Aliases are valid: multiple
 * token spellings may map to the same canonical symbol.
 *
 * The returned object is the same object passed in. Define it once and reuse it
 * so compiled token tables can be cached by object identity.
 *
 * @param definition - The dialect data to validate.
 * @returns The same {@link Dialect} object passed as `definition`.
 * @throws {Error} When literal delimiters are invalid, a token spelling is
 * empty, or a token spelling is listed more than once.
 */
export function defineDialect(definition: Dialect): Dialect {
  const { name, literal, tokens } = definition

  if (literal.open.length === 0 || literal.close.length === 0) {
    throw new Error(
      `Dialect "${name}" must have non-empty literal "open" and "close" delimiters`,
    )
  }

  if (literal.escapedDelimiter !== undefined) {
    if (literal.open !== literal.close) {
      throw new Error(
        `Dialect "${name}" sets an "escapedDelimiter", which only applies to quote-style literals where "open" and "close" match`,
      )
    }
    if (literal.escapedDelimiter.length === 0) {
      throw new Error(`Dialect "${name}" has an empty "escapedDelimiter"`)
    }
  }
  else if (literal.open === literal.close) {
    throw new Error(
      `Dialect "${name}" has matching "open"/"close" but no "escapedDelimiter" — a bracketed dialect cannot escape its delimiter, so they must differ`,
    )
  }

  const seen = new Set<string>()
  for (const { token } of tokens) {
    if (token === '') {
      throw new Error(`Dialect "${name}" has an empty token`)
    }
    if (seen.has(token)) {
      throw new Error(
        `Dialect "${name}" defines token "${token}" more than once`,
      )
    }
    seen.add(token)
  }

  return definition
}
