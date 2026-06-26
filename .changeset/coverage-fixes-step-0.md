---
"rosetta-date": minor
---

Fix the `date-fns` `RR` token. `R…` is zero-padded to width and never truncated,
so `RR` is the full ISO week-year (an alias of `RRRR`), not a 2-digit year. It no
longer maps to `WeekYearTwoDigitIso`. A truncated 2-digit ISO week-year (such as
`moment`'s `GG`) now correctly falls to the unsupported-token policy when
converting to `date-fns`, which has no equivalent token.

Also fill two `ldml` grammar gaps: the bare `Y` / `YYY` local week-year (aliases
of `YYYY`) and the `e`-form formatting weekday names `eee` … `eeeeee` (aliases of
`EEE` … `EEEEEE`). Both flow to `date-fns`, which shares the `ldml` base.
