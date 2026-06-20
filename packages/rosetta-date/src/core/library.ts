import type { CanonicalToken } from './canonical'
import type { Dialect, Library, LibraryDefinition } from './types'

/**
 * A library's effective grammar: its base dialect with any
 * {@link LibraryDefinition.extends} tokens merged in. Computed once, at
 * definition time, so the resulting object identity is stable. This keeps the
 * parser's and renderer's per-grammar caches working and keeps the merge logic
 * reachable only through {@link defineLibrary}, never from a dialect-only render.
 */
function effectiveDialect(def: LibraryDefinition): Dialect {
  if (def.extends === undefined || def.extends.length === 0)
    return def.dialect
  return {
    name: def.name,
    syntax: def.dialect.syntax,
    tokens: [...def.dialect.tokens, ...def.extends],
  }
}

/**
 * Defines and validates a concrete date-format library.
 *
 * @remarks
 * Validation catches extension tokens that collide with the base dialect,
 * duplicate extension token spellings, and `supports` canonicals absent from the
 * effective grammar.
 *
 * The returned {@link Library} includes precomputed render metadata. Define it
 * once and reuse it so compiled token tables can be cached by object identity.
 *
 * @param definition - The library definition to validate and resolve.
 * @returns A {@link Library} with precomputed render metadata.
 * @throws {Error} When `extends` references invalid token spellings or `supports`
 * lists a canonical absent from the effective grammar.
 */
export function defineLibrary(definition: LibraryDefinition): Library {
  const dialectTokens = new Set(definition.dialect.tokens.map(rule => rule.token))

  if (definition.extends !== undefined) {
    const extended = new Set<string>()
    for (const { token } of definition.extends) {
      if (dialectTokens.has(token)) {
        throw new Error(
          `Library "${definition.name}" extends with token "${token}", which the "${definition.dialect.name}" dialect already defines`,
        )
      }
      if (extended.has(token)) {
        throw new Error(
          `Library "${definition.name}" extends with token "${token}" more than once`,
        )
      }
      extended.add(token)
    }
  }

  const dialect = effectiveDialect(definition)

  if (definition.supports !== undefined) {
    const canonicals = new Set<CanonicalToken>(dialect.tokens.map(rule => rule.canonical))
    for (const canonical of definition.supports) {
      if (!canonicals.has(canonical)) {
        throw new Error(
          `Library "${definition.name}" supports canonical "${canonical}", which the "${definition.dialect.name}" dialect and its extensions do not express`,
        )
      }
    }
  }

  const { supports } = definition
  return {
    ...definition,
    resolved: {
      dialect,
      renders: supports === undefined ? () => true : canonical => supports.has(canonical),
    },
  }
}
