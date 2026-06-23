---
"rosetta-date": minor
---

Add composite directives to the `strftime` dialect — `%T` (`%H:%M:%S`), `%R`
(`%H:%M`), `%F` (`%Y-%m-%d`), `%D` (`%m/%d/%y`), and `%r` (`%I:%M:%S %p`). A
composite is a parse-time macro: one spelling that expands to a sub-pattern, so
`%T` parses exactly as `%H:%M:%S`. Rendering produces the expansion, never the
composite, so a composite normalizes on a round trip (like an alias, across
several tokens). Dialects can declare their own with the new optional
`composites` field (`CompositeRule`), generic across syntax families.
