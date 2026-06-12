import type { Dialect, Library, TokenCapability } from './types'

/**
 * A library's effective grammar as a {@link Dialect}: its base dialect plus any
 * {@link Library.extends} tokens. Memoized per library so the object identity is
 * stable, which keeps the parser's and renderer's per-grammar caches working.
 */
const effectiveCache = new WeakMap<Library, Dialect>()

function effectiveDialect(target: Dialect | Library): Dialect {
  if (!('dialect' in target))
    return target
  let effective = effectiveCache.get(target)
  if (effective === undefined) {
    effective = target.extends === undefined || target.extends.length === 0
      ? target.dialect
      : {
          name: target.name,
          literal: target.dialect.literal,
          tokens: [...target.dialect.tokens, ...target.extends],
        }
    effectiveCache.set(target, effective)
  }
  return effective
}

/**
 * Narrow a conversion endpoint to the {@link Dialect} it renders through. A
 * {@link Library} resolves to its *effective* grammar (dialect + extensions); a
 * bare `Dialect` is returned as-is.
 */
export function resolveDialect(target: Dialect | Library): Dialect {
  return effectiveDialect(target)
}

/**
 * Narrow a render target to its effective {@link Dialect} and a per-token
 * capability lookup. A bare `Dialect` renders every token unconditionally; a
 * {@link Library} returns each token's {@link TokenCapability}, or `undefined`
 * when the token is outside its supported set (not rendered at all).
 */
export function resolveTarget(target: Dialect | Library): {
  readonly dialect: Dialect
  readonly capability: (token: string) => TokenCapability | undefined
} {
  if (!('dialect' in target))
    return { dialect: target, capability: () => 'supported' }

  const { supports, capabilities } = target
  return {
    dialect: effectiveDialect(target),
    capability: (token) => {
      if (supports !== undefined && !supports.has(token))
        return undefined
      return capabilities?.get(token) ?? 'supported'
    },
  }
}

/**
 * Build a {@link Library}, validating that its extensions, supported tokens, and
 * capabilities are coherent. Throws at definition time — instead of failing
 * silently later — when an `extends` token collides with a dialect token or is
 * listed twice, a `supports` token is not in the effective grammar, or a
 * `capabilities` key is not among the supported tokens.
 */
export function defineLibrary(library: Library): Library {
  const dialectTokens = new Set(library.dialect.tokens.map(rule => rule.token))
  const known = new Set(dialectTokens)

  if (library.extends !== undefined) {
    const extended = new Set<string>()
    for (const { token } of library.extends) {
      if (dialectTokens.has(token)) {
        throw new Error(
          `Library "${library.name}" extends with token "${token}", which the "${library.dialect.name}" dialect already defines`,
        )
      }
      if (extended.has(token)) {
        throw new Error(
          `Library "${library.name}" extends with token "${token}" more than once`,
        )
      }
      extended.add(token)
      known.add(token)
    }
  }

  if (library.supports !== undefined) {
    for (const token of library.supports) {
      if (!known.has(token)) {
        throw new Error(
          `Library "${library.name}" lists token "${token}", which the "${library.dialect.name}" dialect and its extensions do not define`,
        )
      }
    }
  }

  if (library.capabilities !== undefined) {
    for (const token of library.capabilities.keys()) {
      const renderable = library.supports === undefined ? known.has(token) : library.supports.has(token)
      if (!renderable) {
        throw new Error(
          `Library "${library.name}" sets a capability for "${token}", which is not among its supported tokens`,
        )
      }
    }
  }

  return library
}
