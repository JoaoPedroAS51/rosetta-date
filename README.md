# rosetta-date

> Bidirectionally convert date-format token strings between the **`moment`** and **`unicode`** dialects.

[![npm version](https://img.shields.io/npm/v/rosetta-date.svg)](https://www.npmjs.com/package/rosetta-date)
[![CI](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`rosetta-date` translates date-format token strings between two **dialects** (token grammars):

- **`moment`** — the Moment.js token grammar (e.g. `DD/MM/YYYY`), with literals in `[...]`.
- **`unicode`** — the [Unicode Technical Standard #35 / LDML](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
  date field symbols (e.g. `dd/MM/yyyy`), with literals in `'...'`.

Conversion is **bidirectional** and built on a neutral canonical model: each dialect maps to and from a shared
semantic vocabulary, so directions stay consistent and new dialects can be added without touching the engine.

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

## Status

🚧 **Work in progress.** The repository is scaffolded; the conversion engine, dialect tables, and public API are
being designed. Usage docs and full token tables will land here as the implementation progresses.

## Install

```bash
pnpm add rosetta-date
```

## Token mapping tables

> _To be documented._ Full `moment` ↔ `unicode` token tables (both directions), plus the canonical model they
> map through.

## Non-round-trippable tokens

> _To be documented._ Some tokens are not bijective (ISO week-year, narrow weekday names, localized macro
> tokens, and tokens that exist in only one dialect). The canonical reverse choice for each will be listed here.

## License

[MIT](./LICENSE) © João Pedro Antunes Silva
