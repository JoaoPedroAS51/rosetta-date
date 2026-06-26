---
"rosetta-date": minor
---

Recognize the LDML numeric stand-alone forms in `ldml` (and `date-fns`, which
shares the base): `L`/`LL` (month), `q`/`qq` (quarter), and `c`/`cc` (weekday).
A numeric form carries no stand-alone inflection, so these alias the formatting
numerics (`M`/`Q`/`e`) rather than getting their own canonicals; only the named
stand-alone forms (`LLL`/`qqq`/`ccc`) stay distinct. A new `WeekdayTwoDigit`
canonical (`weekday/2-digit`) backs the 2-digit weekday number `ee`/`cc`.
