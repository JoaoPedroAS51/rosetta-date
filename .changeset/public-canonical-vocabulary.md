---
"rosetta-date": minor
---

Export the canonical vocabulary so `defineDialect` and `defineLibrary({ extends })` are usable from outside the package. `Canonical` (and the `CanonicalToken`, `TokenRule`, `LiteralRules` types) are now part of the public API at the package root; their `field/style` string values are covered by semver.
