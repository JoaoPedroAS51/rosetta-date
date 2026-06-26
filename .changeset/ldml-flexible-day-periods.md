---
"rosetta-date": minor
---

Recognize the LDML flexible day-period symbols `b` and `B` in `ldml` (and
`date-fns`, which shares the base). `b` extends AM/PM with noon and midnight; `B`
is the locale's flexible day ranges ("in the morning", "at night"). Both are
modeled as a type qualifier on the day-period field across all three widths: six
new canonicals, `day-period/{abbreviated,wide,narrow}/{extended,flexible}`.
Converting them into a grammar that only has plain AM/PM falls to the
unsupported-token policy rather than silently collapsing to `a`.
