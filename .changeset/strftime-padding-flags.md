---
"rosetta-date": minor
---

Recognize the glibc `strftime` padding flags `%-X` (unpadded) and `%0X` (explicit
zero). Both map to canonicals the core directives already cover: `%-X` reaches the
`numeric` style and `%0X` the default `2-digit`/`3-digit`. `%-X` notably fills the
plain numeric forms the bare directives lacked — `%-d`/`%-m`/`%-H`/`%-I`/`%-M`/
`%-S`/`%-j`/`%-V` — so a numeric `moment` `D` or `ldml` `d` now round-trips through
`strftime` instead of falling to the unsupported-token policy. `%0X` is redundant
with the bare directive, so it parses but normalizes to `%X` on render.
