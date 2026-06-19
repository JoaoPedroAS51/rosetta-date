---
"rosetta-date": minor
---

**Breaking:** Move ordinal `...o` tokens out of the pure `ldml` dialect and into the `dateFns` library. Tokens such as `Mo`, `do`, `Qo`, `wo`, and `Do` are date-fns extensions, not bare LDML fields, so pure `ldml` conversions no longer treat them as built-in tokens.
