import type { Dialect, Library } from './types'

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
 * Narrow a render target to its effective {@link Dialect} plus the optional
 * support filter. A bare `Dialect` has no filter (it renders its whole grammar);
 * a {@link Library} contributes its `supports` set, if any.
 */
export function resolveTarget(target: Dialect | Library): {
  readonly dialect: Dialect
  readonly supports: ReadonlySet<string> | undefined
} {
  return 'dialect' in target
    ? { dialect: effectiveDialect(target), supports: target.supports }
    : { dialect: target, supports: undefined }
}

/**
 * Build a {@link Library}, validating that its extensions and supported tokens are
 * coherent. Throws at definition time — instead of failing silently later — when
 * an `extends` token collides with a dialect token, or a `supports` token is not
 * in the effective grammar.
 */
export function defineLibrary(library: Library): Library {
  const dialectTokens = new Set(library.dialect.tokens.map(rule => rule.token))

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
    }
  }

  if (library.supports !== undefined) {
    const known = new Set(dialectTokens)
    for (const { token } of library.extends ?? [])
      known.add(token)
    for (const token of library.supports) {
      if (!known.has(token)) {
        throw new Error(
          `Library "${library.name}" lists token "${token}", which the "${library.dialect.name}" dialect and its extensions do not define`,
        )
      }
    }
  }

  return library
}
