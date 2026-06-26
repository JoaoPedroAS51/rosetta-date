---
"rosetta-date": minor
---

Recognize the LDML `Z`-for-zero offset symbols `XX` and `XXX` in `ldml` (and
`date-fns`, which shares the base). These are the ISO 8601 offsets that emit `Z`
at the zero (UTC) offset instead of a numeric `+0000`/`+00:00`. Two new canonicals
model this as a `zulu` qualifier on the offset style: `offset/without-colon/zulu`
(`XX`) and `offset/with-colon/zulu` (`XXX`). The `Intl` adapter reports them
unsupported, since `Intl` cannot emit `Z` for the zero offset.
