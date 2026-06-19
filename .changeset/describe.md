---
"rosetta-date": minor
---

Add `describe(format, endpoint)` — the read-only counterpart to `convert`. It
parses a format string and returns its segments with the canonical semantics
that conversion keeps internal: each recognized token decoded into its
`field`/`style`/`qualifiers`, with literals and unrecognized runs passed through
verbatim. Useful for docs, tooltips, and validation. The underlying
`decodeCanonical` helper (and its `DecodedCanonical` type) is now public too.
