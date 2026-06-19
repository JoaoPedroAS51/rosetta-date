---
"rosetta-date": minor
---

**Breaking:** Normalize canonical values to `field/style[/qualifier]`: the ISO
week-numbering fields and the hour cycle are now trailing qualifiers instead of
being baked into the field name. Members are renamed to match — a member's name is the PascalCase of
its value — e.g. `IsoWeekYearNumeric` → `WeekYearNumericIso` (`week-year/numeric/iso`)
and `Hour24Numeric` → `HourNumericH23` (`hour/numeric/h23`, matching the Intl hour
cycle). The hour members `Hour12`/`Hour24`/`Hour24From1`/`Hour11` become
`…H12`/`…H23`/`…H24`/`…H11`.
