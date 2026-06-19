---
"rosetta-date": minor
---

**Breaking:** `LibraryDefinition.supports` is now keyed by canonical field
(`ReadonlySet<CanonicalToken>`) rather than token spelling (`ReadonlySet<string>`).
A library now declares *which fields* it renders, independent of how its dialect
spells them, so aliases collapse to a single entry and the subset stays stable
across spelling changes. `ResolvedLibrary.renders` correspondingly takes a
`CanonicalToken`. `defineLibrary` validates `supports` against the fields the
effective grammar can express.
