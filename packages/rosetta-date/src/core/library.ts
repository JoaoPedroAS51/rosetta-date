import type { CanonicalToken } from './canonical'
import type { Dialect, Library, LibraryDefinition } from './types'

/** Merge a library's extension tokens into its base dialect. */
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
 * Validate and resolve a concrete date-format library.
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
