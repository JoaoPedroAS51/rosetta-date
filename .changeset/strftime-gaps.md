---
"rosetta-date": minor
---

Fill remaining `strftime` directive gaps. New atomic directives: `%C` (century,
2-digit) — backed by the new `Canonical.CenturyTwoDigit` — and `%g` (ISO
week-numbering year, 2-digit, mapping to the existing `WeekYearTwoDigitIso`,
shared with `moment`'s `GG`). New composites `%n` and `%t` expand to a literal
newline/tab, applying the parse-time macro mechanism to literal whitespace, so
they normalize to that raw character on a round trip. `%C` has no clean target in
the other built-in dialects, so it round-trips through `strftime` and falls to
the unsupported-token policy elsewhere.
