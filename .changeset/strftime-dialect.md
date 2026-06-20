---
"rosetta-date": minor
---

Add the `strftime` dialect (C / POSIX `%`-directives) at `rosetta-date/dialects`,
covering the atomic single-field directives. This generalizes the engine into
**tokenization families**: a dialect's `syntax` is now a discriminated union over
a `delimited` family (letter tokens with `[…]`/`'…'` literals — moment, ldml) and
a new `directive` family (`%`-prefixed tokens, `%%` for a literal marker). The
parser and renderer are generic over the family, so a new grammar is a new
strategy, not an engine change. Also adds the `space-padded` canonical style
(strftime `%e`/`%k`/`%l`) alongside `numeric` and `2-digit`.

**Breaking:** `Dialect.literal: LiteralRules` is now `Dialect.syntax: TokenSyntax`.
A delimited dialect that was `{ literal: { open, close, escapedDelimiter? } }`
becomes `{ syntax: { kind: 'delimited', open, close, escapedDelimiter? } }`. The
`LiteralRules` type is replaced by `TokenSyntax` / `DelimitedSyntax` /
`DirectiveSyntax`.
