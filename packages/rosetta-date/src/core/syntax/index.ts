import type { TokenSyntax } from '../types'
import type { SyntaxStrategy } from './strategy'
import { assertNever } from '../assert'
import { delimitedStrategy } from './delimited'
import { directiveStrategy } from './directive'

export type { Scan, SyntaxStrategy } from './strategy'

const cache = new WeakMap<TokenSyntax, SyntaxStrategy>()

/** Build the strategy for a syntax family. The union forces this switch to stay exhaustive. */
function strategyFor(syntax: TokenSyntax): SyntaxStrategy {
  switch (syntax.kind) {
    case 'directive':
      return directiveStrategy(syntax)
    case 'delimited':
      return delimitedStrategy(syntax)
    default:
      return assertNever(syntax)
  }
}

/**
 * Resolve a {@link TokenSyntax} config to its {@link SyntaxStrategy}, cached by
 * config identity.
 *
 * @internal
 */
export function resolveSyntax(syntax: TokenSyntax): SyntaxStrategy {
  let strategy = cache.get(syntax)
  if (strategy === undefined) {
    strategy = strategyFor(syntax)
    cache.set(syntax, strategy)
  }
  return strategy
}
