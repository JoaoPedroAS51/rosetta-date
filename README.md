# rosetta-date

> Bidirectionally convert date-format token strings between the **`moment`** and **`unicode`** dialects.

[![npm version](https://img.shields.io/npm/v/rosetta-date.svg)](https://www.npmjs.com/package/rosetta-date)
[![CI](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`rosetta-date` translates date-format token strings between two **dialects** (token grammars):

- **`moment`** — the Moment.js token grammar (e.g. `DD/MM/YYYY`), with literals in `[...]`.
- **`unicode`** — the [Unicode Technical Standard #35 / LDML](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
  date field symbols (e.g. `dd/MM/yyyy`), with literals in `'...'`.

Conversion is **bidirectional** and routes through a neutral canonical model: each dialect maps to and from a
shared semantic vocabulary, so directions stay consistent and new dialects can be added without touching the
engine. This is what keeps the case-sensitive traps straight — moment `DD` (day of month) becomes unicode `dd`,
never `DD` (which in LDML is day of *year*).

- **Zero runtime dependencies**
- **ESM-only**, ships with types
- **Escape-aware tokenizer** (longest-token-first), handling `moment` `[literals]` and `unicode` `'literals'`

## Dialects vs. libraries

A **dialect** is a token grammar. A **library** is an implementation that *speaks* a dialect — often a subset or
variant of it. `rosetta-date` converts between **dialects**; the libraries below are the common speakers of each:

| Library | Dialect it speaks |
| --- | --- |
| [Moment.js](https://momentjs.com/docs/#/displaying/format/) | `moment` (full) |
| [Day.js](https://day.js.org/docs/en/display/format) | `moment` (core subset, `+` plugins such as AdvancedFormat) |
| [date-fns](https://date-fns.org/docs/format) | `unicode` (subset + library-specific rules) |

So translating a Day.js format to a date-fns format is, in this library's terms, converting from the `moment`
dialect to the `unicode` dialect.

## Install

```bash
pnpm add rosetta-date
```

## Usage

```ts
import { convert, createConverter } from 'rosetta-date'
import { moment, unicode } from 'rosetta-date/dialects'

// One-off, direction travels with the call:
convert('DD/MM/YYYY', { from: moment, to: unicode }) // 'dd/MM/yyyy'
convert('yyyy-MM-dd', { from: unicode, to: moment }) // 'YYYY-MM-DD'

// Fixed direction reused many times — bind once, call often:
const toDateFns = createConverter(moment, unicode)
toDateFns('YYYY-MM-DD') // 'yyyy-MM-dd'
toDateFns('hh:mm A') // 'hh:mm a'
```

`createConverter` returns a plain `(format: string) => string`, handy to store or pass around as a callback.

### Dialects are objects (tree-shakeable)

The conversion API lives at `rosetta-date`; the dialects live at `rosetta-date/dialects`. `from` and `to` take
**dialect objects** you import (`moment`, `unicode`). Passing the dialects in keeps the conversion functions free
of a central registry, so a bundle that uses only one pair tree-shakes the unused dialect tables — and you can
pass a **custom `Dialect`** of your own.

For a name-driven path (e.g. a dialect chosen from config), `getDialect` resolves a `DialectName` to its object.
By design this reference pulls in every built-in dialect, so reach for it only when the direction is dynamic:

```ts
import { convert } from 'rosetta-date'
import { getDialect } from 'rosetta-date/dialects'

convert(format, { from: getDialect(config.from), to: getDialect(config.to) })
```

Library names like `'dayjs'` / `'date-fns'` are intentionally **not** accepted: they're reserved for a future
per-library profile layer, so the name can carry the library-precise semantics it implies.

## Token mapping

The tables below list the tokens that round-trip between dialects. `rosetta-date` is **permissive**: it never
throws. A token with no equivalent in the target dialect, or any unrecognized letter run, is emitted as an
**escaped literal** so it can never be silently re-read as a different token.

### Year

| Meaning | `moment` | `unicode` |
| --- | --- | --- |
| Calendar year | `YYYY` | `yyyy` |
| Calendar year, 2-digit | `YY` | `yy` |
| Local week-numbering year | `gggg` | `YYYY` |
| Local week-numbering year, 2-digit | `gg` | `YY` |
| ISO week-numbering year | `GGGG` | `RRRR` |
| ISO week-numbering year, 2-digit | `GG` | `RR` |

### Month & quarter

| Meaning | `moment` | `unicode` |
| --- | --- | --- |
| Quarter | `Q` | `Q` |
| Quarter, ordinal | `Qo` | `Qo` |
| Month | `M` | `M` |
| Month, 2-digit | `MM` | `MM` |
| Month, ordinal | `Mo` | `Mo` |
| Month, abbreviated | `MMM` | `MMM` |
| Month, wide | `MMMM` | `MMMM` |

### Week & day

| Meaning | `moment` | `unicode` |
| --- | --- | --- |
| Week of year | `w` | `w` |
| Week of year, 2-digit | `ww` | `ww` |
| ISO week of year | `W` | `I` |
| ISO week of year, 2-digit | `WW` | `II` |
| Day of month | `D` | `d` |
| Day of month, 2-digit | `DD` | `dd` |
| Day of month, ordinal | `Do` | `do` |
| Day of year | `DDD` | `D` |
| Day of year, 3-digit | `DDDD` | `DDD` |

### Weekday

| Meaning | `moment` | `unicode` |
| --- | --- | --- |
| Weekday, abbreviated | `ddd` | `EEE` |
| Weekday, wide | `dddd` | `EEEE` |
| Weekday, short | `dd` | `EEEEEE` |
| Weekday, number | `d` | `e` |
| ISO weekday, number | `E` | `i` |

### Time

| Meaning | `moment` | `unicode` |
| --- | --- | --- |
| AM/PM | `A` | `a` |
| Hour 1–12 | `h` | `h` |
| Hour 1–12, 2-digit | `hh` | `hh` |
| Hour 0–23 | `H` | `H` |
| Hour 0–23, 2-digit | `HH` | `HH` |
| Hour 1–24 | `k` | `k` |
| Hour 1–24, 2-digit | `kk` | `kk` |
| Minute | `m` | `m` |
| Minute, 2-digit | `mm` | `mm` |
| Second | `s` | `s` |
| Second, 2-digit | `ss` | `ss` |
| Fractional second (1–3 digits) | `S` `SS` `SSS` | `S` `SS` `SSS` |

### Time zone & epoch

| Meaning | `moment` | `unicode` |
| --- | --- | --- |
| Time-zone name | `z` | `zzz` |
| Offset, `±hh:mm` | `Z` | `xxx` |
| Offset, `±hhmm` | `ZZ` | `xx` |
| Unix timestamp, seconds | `X` | `t` |
| Unix timestamp, milliseconds | `x` | `T` |

### Aliases

A few extra spellings are **parsed** but normalize to the primary token above when rendered:

- `moment` `Y` → calendar year (like `YYYY`).
- `unicode` `y` / `yyy` → calendar year; `R` → ISO week-year; `EE` → abbreviated weekday;
  `aa` / `aaa` → AM/PM; `z` / `zz` → time-zone name.

## Non-round-trippable tokens

These exist only in `unicode` (date-fns); `moment` has no equivalent, so converting them **to `moment`**
produces an escaped literal (e.g. `MMMMM` → `[MMMMM]`) rather than a wrong guess:

| `unicode` | Meaning |
| --- | --- |
| `G` `GG` `GGG` `GGGG` `GGGGG` | Era (abbreviated / wide / narrow) |
| `MMMMM` | Narrow month |
| `EEEEE` | Narrow weekday |
| `aaaa` `aaaaa` | Wide / narrow day period |
| `K` `KK` | Hour 0–11 |
| `DD` | Day of year, 2-digit |

Also note: `moment` `d` (weekday number, `0`–`6`) and `unicode` `e` (locale-dependent) map to each other but use
different numbering, and the AM/PM marker loses its moment casing (`A`/`a` both become `a`).

## date-fns gotchas

When the output uses `unicode` tokens that date-fns guards by default, you must opt in:

- Day of year (`D`, `DD`) requires `useAdditionalDayOfYearTokens: true`.
- Local week-year (`Y`, `YYYY`) requires `useAdditionalWeekYearTokens: true`.

`rosetta-date` produces the standards-correct token; enabling these flags is the caller's responsibility.

## Literals

Literal (verbatim) text is preserved across dialects:

- `moment` brackets `[...]` ↔ `unicode` quotes `'...'`.
- A literal apostrophe is `''` in `unicode` (e.g. `'o''clock'` → `o'clock`).
- Only the letter-bearing span is escaped, so separators stay clean: `DD/MM` ↔ `dd/MM`, not `dd'/'MM`.

## License

[MIT](./LICENSE) © João Pedro Antunes Silva
