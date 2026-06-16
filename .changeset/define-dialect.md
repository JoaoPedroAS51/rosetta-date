---
"rosetta-date": minor
---

Add `defineDialect`, a definition-time helper mirroring `defineLibrary`. It validates a dialect (rejecting duplicate token spellings and incoherent literal rules) and returns a stable object to reuse across conversions.
