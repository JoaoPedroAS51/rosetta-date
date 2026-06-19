import type { Dialect } from './types'

/**
 * Build a {@link Dialect} from its plain-data definition, validating at definition
 * time — instead of failing silently later — that its token table and literal
 * rules are coherent. Throws when a token spelling is empty or listed twice, when
 * the literal delimiters are empty, when an `escapedDelimiter` is set for a
 * bracketed dialect (it only applies to quote-style literals, where `open` and
 * `close` match), or when a bracketed dialect's `open` and `close` are equal —
 * the renderer can only escape a literal delimiter when the two differ.
 *
 * A dialect is already plain data, so this returns the very object passed in —
 * call it once and reuse that result: the engine caches compiled token tables by
 * object identity, so a dialect rebuilt on every conversion recompiles rather
 * than hitting the cache. Aliases (several tokens sharing one canonical symbol)
 * are expected and never throw; only a repeated `token` spelling does.
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
