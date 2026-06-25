---
"rosetta-date": minor
---

**Breaking:** Model blank-padding as a `space-padded` qualifier on the width style
rather than a standalone style, so padding composes with any field. Three
canonicals are renamed: `DayOfMonthSpacePadded` →
`DayOfMonthTwoDigitSpacePadded` (`day-of-month/2-digit/space-padded`),
`HourSpacePaddedH12` → `HourTwoDigitH12SpacePadded`
(`hour/2-digit/h12/space-padded`), and `HourSpacePaddedH23` →
`HourTwoDigitH23SpacePadded` (`hour/2-digit/h23/space-padded`). Conversions are
unaffected: only the member names and values change.

On top of that, recognize the glibc blank-padding flag `%_X` in `strftime`,
extending blank-padding to fields that lacked it via five new canonicals
(`month`, `minute`, `second`, `day-of-year`, ISO `week-of-year`). `%_d`/`%_H`/`%_I`
are the flag form of `%e`/`%k`/`%l` and normalize to them. The `Intl` adapter
reports any `space-padded` field unsupported, since `Intl` cannot force a fill
character. Qualifier order is now a documented rule: identity qualifiers (`iso`,
hour cycle, `standalone`) precede presentation ones (`space-padded`, `lower`).
