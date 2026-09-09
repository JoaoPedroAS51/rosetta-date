import type { DirectiveSyntax } from '../types'
import type { Scan, SyntaxStrategy } from './strategy'
import { matchToken } from '../tokenize'

/**
 * Build the tokenizer for a {@link DirectiveSyntax} dialect.
 */
export function directiveStrategy(config: DirectiveSyntax): SyntaxStrategy {
  const { marker } = config
  const escaped = marker + marker

  return {
    scan(input, index, tokens, composites): Scan {
      if (!input.startsWith(marker, index))
        return { kind: 'literal', value: input.charAt(index), next: index + 1 }

      if (input.startsWith(escaped, index))
        return { kind: 'literal', value: marker, next: index + escaped.length }

      const match = matchToken(tokens, input, index)
      if (match !== undefined)
        return { kind: 'token', token: match.token, canonical: match.canonical, next: index + match.token.length }

      const composite = matchToken(composites, input, index)
      if (composite !== undefined)
        return { kind: 'composite', token: composite.token, expandsTo: composite.expandsTo, next: index + composite.token.length }

      // Consume the marker and following character as one unrecognized token.
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
