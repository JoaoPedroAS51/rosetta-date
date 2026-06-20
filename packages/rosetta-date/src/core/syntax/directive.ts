import type { DirectiveSyntax } from '../types'
import type { Scan, SyntaxStrategy } from './strategy'
import { matchToken } from '../tokenize'

/**
 * Build the strategy for a {@link DirectiveSyntax} dialect.
 *
 * @remarks
 * Tokens are marker-prefixed and self-delimiting, so escaping only has to double
 * the marker, and adjacent tokens never need a separator. A marker followed by
 * an undefined directive is an `unknown` run (surfaced to the policy), never a
 * silent literal.
 */
export function directiveStrategy(config: DirectiveSyntax): SyntaxStrategy {
  const { marker } = config
  const escaped = marker + marker

  return {
    scan(input, index, tokens): Scan {
      if (!input.startsWith(marker, index))
        return { kind: 'literal', value: input.charAt(index), next: index + 1 }

      if (input.startsWith(escaped, index))
        return { kind: 'literal', value: marker, next: index + escaped.length }

      const match = matchToken(tokens, input, index)
      if (match !== undefined)
        return { kind: 'token', token: match.token, canonical: match.canonical, next: index + match.token.length }

      // Marker + an unrecognized directive: consume the marker and the next
      // character as one unrecognized token.
      const end = Math.min(index + marker.length + 1, input.length)
      return { kind: 'unknown', value: input.slice(index, end), next: end }
    },

    escapeLiteral(value) {
      return value.replaceAll(marker, escaped)
    },

    separator() {
      return ''
    },
  }
}
