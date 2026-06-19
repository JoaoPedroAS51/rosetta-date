---
"rosetta-date": minor
---

Add an `Intl.DateTimeFormat` adapter at `rosetta-date/intl`. `toIntlOptions`
reads a format string into an `Intl.DateTimeFormatOptions` bag — the bridge from
a hardcoded legacy pattern to native, locale-aware formatting. `fromIntlOptions`
goes the other way, mapping the style axis (`dateStyle`/`timeStyle`) to the
target's localized presets (`L`/`P`) so the library still resolves the locale at
format time. Fields with no Intl equivalent are handled by `onUnsupportedToken`.
