---
"rosetta-date": minor
---

Add the stand-alone (nominative) name fields for month, quarter, and weekday —
`MonthWideStandalone`, `QuarterWideStandalone`, `WeekdayWideStandalone`, and their
abbreviated/narrow (plus weekday short) siblings, ten in all — mapped to the LDML
`LLL`/`qqq`/`ccc` token families. They preserve the grammatical-context distinction
(a name used within a date vs. one shown on its own) that several languages inflect
differently, instead of collapsing it onto the formatting forms.
