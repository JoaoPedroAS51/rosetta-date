import type { Dialect, Library, LibraryDefinition } from './types'

/**
 * A library's effective grammar: its base dialect with any
 * {@link LibraryDefinition.extends} tokens merged in. Computed once, at
 * definition time, so the resulting object identity is stable — which keeps the
 * parser's and renderer's per-grammar caches working — and so the merge logic is
 * reachable only through {@link defineLibrary}, never from a dialect-only render.
 */
function effectiveDialect(def: LibraryDefinition): Dialect {
  if (def.extends === undefined || def.extends.length === 0)
    return def.dialect
  return {
    name: def.name,
    literal: def.dialect.literal,
    tokens: [...def.dialect.tokens, ...def.extends],
  }
}

/**
 * Build a {@link Library} from its {@link LibraryDefinition}, validating that its
 * extensions and supported tokens are coherent and precomputing its render
 * target. Throws at definition time — instead of failing silently later — when an
 * `extends` token collides with a dialect token or is listed twice, or a
 * `supports` token is not in the effective grammar.
 *
 * Call this once per library and reuse the result: the engine caches compiled
 * tables by object identity, so a `Library` rebuilt on every conversion recompiles
 * rather than hitting the cache.
 */
export function defineLibrary(definition: LibraryDefinition): Library {
  const dialectTokens = new Set(definition.dialect.tokens.map(rule => rule.token))
  const known = new Set(dialectTokens)

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
      known.add(token)
    }
  }

  if (definition.supports !== undefined) {
    for (const token of definition.supports) {
      if (!known.has(token)) {
        throw new Error(
          `Library "${definition.name}" lists token "${token}", which the "${definition.dialect.name}" dialect and its extensions do not define`,
        )
      }
    }
  }

  const { supports } = definition
  return {
    ...definition,
    resolved: {
      dialect: effectiveDialect(definition),
      renders: supports === undefined ? () => true : token => supports.has(token),
    },
  }
}
