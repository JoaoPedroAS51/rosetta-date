# rosetta-date

> A translation engine for date-formatting languages.

[![npm version](https://img.shields.io/npm/v/rosetta-date.svg)](https://www.npmjs.com/package/rosetta-date)
[![CI](https://img.shields.io/github/actions/workflow/status/JoaoPedroAS51/rosetta-date/ci.yml?branch=main&label=CI)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![coverage](https://codecov.io/gh/JoaoPedroAS51/rosetta-date/branch/main/graph/badge.svg)](https://codecov.io/gh/JoaoPedroAS51/rosetta-date)
[![bundle size](https://img.shields.io/bundlejs/size/rosetta-date?label=bundle%20%28gzip%29)](https://bundlejs.com/?q=rosetta-date)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`rosetta-date` translates date-format strings between formatting languages by routing recognized tokens through a canonical intermediate representation before rendering them in the target language.

```ts
import { convert } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'

convert('YYYY-MM-DD', { from: moment, to: ldml }) // 'yyyy-MM-dd'
```

Although `YYYY-MM-DD` and `yyyy-MM-dd` look different, they express the same date format using different formatting languages. `rosetta-date` rewrites the token string while leaving date values untouched.

## Highlights

- 🔁 **Bidirectional:** Each dialect parses tokens to canonical fields and renders canonical fields back to tokens.
- 🧭 **Canonical semantic model:** Tokens convert through shared meanings instead of pairwise dialect mappings.
- 🧩 **Extensible by design:** New dialects map to the canonical model; libraries extend or narrow a dialect.
- 🛡️ **Escape-aware tokenizer:** Literals round-trip across dialects.
- 🌐 **`Intl` adapter:** Convert a token pattern to `Intl.DateTimeFormat` options and back.
- 🔍 **Introspectable:** `describe` reports what a pattern means, and `explain` reports what a conversion would do.
- 🌳 **Tree-shakeable:** Dialects and libraries ship from their own entrypoints.
- 🪶 **Zero runtime dependencies:** No runtime dependencies.

## Documentation

This README is a quick start. The [full documentation](https://rosetta-date.dev) includes:

- [How it works](https://rosetta-date.dev/concepts/how-it-works): the canonical model behind every conversion.
- [Dialects & Libraries](https://rosetta-date.dev/concepts/dialects-and-libraries): when to use each endpoint type.
- [Custom dialects & libraries](https://rosetta-date.dev/guides/custom-dialects): define a new dialect or library.
- [Unsupported tokens](https://rosetta-date.dev/guides/unsupported-tokens): what happens when a token has no clean target.
- [Token mapping](https://rosetta-date.dev/reference/token-mapping): the per-token grammar tables.
- [Libraries](https://rosetta-date.dev/reference/libraries): tool-specific coverage and caveats.
- [API reference](https://rosetta-date.dev/reference/api): every export, signature, and type.

## Install

```bash
npm install rosetta-date
```

> `rosetta-date` is in active development. Minor releases may include breaking changes. Pin an exact
> version in your `package.json` and review the changelog before upgrading.

<details><summary>pnpm / yarn / bun</summary>

```bash
pnpm add rosetta-date
yarn add rosetta-date
bun add rosetta-date
```

</details>

**Requirements:** Node ≥ 22 and an ESM project. Use `import`; the package does not support `require()`.

## Usage

The conversion API lives at the package root; **dialects** and **libraries** are imported from their own
entrypoints and passed in.

```ts
import { convert, createConverter } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'

// One-off, direction travels with the call:
convert('DD/MM/YYYY', { from: moment, to: ldml }) // 'dd/MM/yyyy'
convert('yyyy-MM-dd', { from: ldml, to: moment }) // 'YYYY-MM-DD'

// Bind a fixed direction once and reuse it:
const toLdml = createConverter(moment, ldml)
toLdml('YYYY-MM-DD') // 'yyyy-MM-dd'
toLdml('hh:mm A') // 'hh:mm a'
```

A `Dialect` is a formatting language (grammar + literals); a `Library` models one tool on top of a
dialect (the tokens it renders, its aliases, its limits). `from` and `to` each take either, so you can
combine them in either direction. Converting *to* a library flags tokens it cannot render:

```ts
import { convert, createConverter } from 'rosetta-date'
import { dateFns, dayjs, momentjs } from 'rosetta-date/libraries'

// Library → library reads like the intent:
convert('DD/MM/YYYY', { from: momentjs, to: dateFns }) // 'dd/MM/yyyy'

// Day.js can't render `Mo`, so a strict converter throws instead of passing through a token it would mis-format:
const safeForDayjs = createConverter(momentjs, dayjs, { onUnsupportedToken: 'throw' })
safeForDayjs('YYYY-MM-DD') // 'YYYY-MM-DD'
safeForDayjs('Mo') // throws UnsupportedTokenError
```

Bridge a token pattern to the native [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) API, and back, from `rosetta-date/intl`:

```ts
import { moment } from 'rosetta-date/dialects'
import { fromIntlOptions, toIntlOptions } from 'rosetta-date/intl'
import { dayjs } from 'rosetta-date/libraries'

// Let the locale arrange the components:
toIntlOptions('DD/MM/YYYY', { from: moment }) // { day: '2-digit', month: '2-digit', year: 'numeric' }

// The style axis round-trips through each library's localized preset:
fromIntlOptions({ dateStyle: 'short' }, { to: dayjs }) // 'L'
```

You can also inspect a pattern without converting it. `describe` reports what the pattern means, and
`explain` reports what a conversion would do:

```ts
import { describe, explain } from 'rosetta-date'
import { moment } from 'rosetta-date/dialects'
import { dayjs } from 'rosetta-date/libraries'

describe('DD/MM', moment)
// [ { kind: 'field', token: 'DD', canonical: 'day-of-month/2-digit', field: 'day-of-month', style: '2-digit', qualifiers: [] },
//   { kind: 'literal', value: '/' },
//   { kind: 'field', token: 'MM', canonical: 'month/2-digit', field: 'month', style: '2-digit', qualifiers: [] } ]

// Inspect a conversion: `DDD` (day of year) has no Day.js token.
explain('DDD', { from: moment, to: dayjs })
// [ { kind: 'field', token: 'DDD', canonical: 'day-of-year/numeric', ..., status: 'unsupported', reason: 'unsupported-by-target' } ]
```

See [Converting](https://rosetta-date.dev/guides/converting), [Describing formats](https://rosetta-date.dev/guides/describe), [Explaining conversions](https://rosetta-date.dev/guides/explain), [Intl Options](https://rosetta-date.dev/guides/intl), [Dialects & Libraries](https://rosetta-date.dev/concepts/dialects-and-libraries),
and [Custom dialects & libraries](https://rosetta-date.dev/guides/custom-dialects) for detailed usage.

## Supported dialects & libraries

Import dialects from `rosetta-date/dialects`:

| Dialect    | Grammar                                                          | Example      | Literals |
| ---------- | ---------------------------------------------------------------- | ------------ | -------- |
| `moment`   | [Moment.js][momentjs-docs] token grammar                         | `DD/MM/YYYY` | `[...]`  |
| `ldml`     | [Unicode Technical Standard #35 / LDML][ldml] date field symbols | `dd/MM/yyyy` | `'...'`  |
| `strftime` | [C / POSIX `strftime`][strftime] `%`-directive grammar           | `%d/%m/%Y`   | `%%`     |

Import libraries from `rosetta-date/libraries`:

| Library    | Tool                       | Speaks   | Coverage                                                                                                          |
| ---------- | -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `momentjs` | [Moment.js][momentjs-docs] | `moment` | the full grammar                                                                                                  |
| `dayjs`    | [Day.js][dayjs-docs]       | `moment` | a core subset + the common plugins (AdvancedFormat, LocalizedFormat)                                              |
| `dateFns`  | [date-fns][date-fns-docs]  | `ldml`   | the full grammar **+ its own extensions** (`P…`, `t`/`T`, `R`/`I`/`i`); some tokens gated behind date-fns options |

The per-token grammar tables are in [Token mapping](https://rosetta-date.dev/reference/token-mapping); tool-specific
behaviour is in [Libraries](https://rosetta-date.dev/reference/libraries).

## How it works

`rosetta-date` maps every recognized token to a **canonical semantic representation** before rendering it in the
target dialect. The representation records what the token means independently of any dialect:

```text
Source Library  →  Source Dialect  →  Canonical Representation  →  Target Dialect  →  Target Library
```

Each dialect maps to and from this shared vocabulary. A new dialect or library connects to the canonical
model instead of defining converters for every existing dialect.

## Contributing

Contributions are welcome. The [Contributing guide](https://rosetta-date.dev/contributing) covers local setup, the
project scripts, the testing layout, and how to add a new dialect or library.

## License

[MIT](./LICENSE) © João Pedro Antunes Silva

[date-fns-docs]: https://date-fns.org/docs/format
[dayjs-docs]: https://day.js.org/docs/en/display/format
[ldml]: https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
[momentjs-docs]: https://momentjs.com/docs/#/displaying/format/
[strftime]: https://pubs.opengroup.org/onlinepubs/9699919799/functions/strftime.html
