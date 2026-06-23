---
"rosetta-date": minor
---

**Breaking:** Model the lowercase day period. A new canonical
`DayPeriodAbbreviatedLower` (`day-period/abbreviated/lower`) carries the
forced-lowercase am/pm that some grammars bake into the spelling, added as
`strftime`'s `%P` (glibc extension) and remapped onto `moment`'s `a`. The unmarked
`DayPeriodAbbreviated` stays the de-facto uppercase default (`%p`, `A`), so there
is no separate `upper`.

This preserves case where both endpoints encode it (`a` ↔ `%P`) instead of
silently dropping it, which changes existing output. `moment`'s `a` no longer
normalizes to `A` — including on `moment`→`moment` round trips — and converting a
lowercase day period to a grammar that cannot force lowercase (the `ldml` dialect,
and the `date-fns` library built on it) now falls to the unsupported-token policy
rather than emitting a default-cased token.
