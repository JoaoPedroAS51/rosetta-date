import type { Dialect, Library } from './types'

/**
 * Narrow a conversion endpoint to the {@link Dialect} it renders through. A
 * {@link Library} resolves to its `dialect`; a bare `Dialect` is returned as-is.
 */
export function resolveDialect(target: Dialect | Library): Dialect {
  return 'dialect' in target ? target.dialect : target
}

/**
 * Narrow a render target to its {@link Dialect} plus the optional support filter.
 * A bare `Dialect` has no filter (it supports its whole grammar); a
 * {@link Library} contributes its `supports` set, if any.
 */
export function resolveTarget(target: Dialect | Library): {
  readonly dialect: Dialect
  readonly supports: ReadonlySet<string> | undefined
} {
  return 'dialect' in target
    ? { dialect: target.dialect, supports: target.supports }
    : { dialect: target, supports: undefined }
}

/**
 * Build a {@link Library}, validating that every supported token exists in its
 * dialect. Throws on an unknown token so a typo — or a token later dropped from
 * the grammar — is caught at definition time instead of silently ignored.
 */
export function defineLibrary(library: Library): Library {
  if (library.supports !== undefined) {
    const known = new Set(library.dialect.tokens.map(rule => rule.token))
    for (const token of library.supports) {
      if (!known.has(token)) {
        throw new Error(
          `Library "${library.name}" lists token "${token}", which the "${library.dialect.name}" dialect does not define`,
        )
      }
    }
  }
  return library
}
