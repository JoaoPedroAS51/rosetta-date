# rosetta-date

> A translation engine for date-formatting languages.

[![npm version](https://img.shields.io/npm/v/rosetta-date.svg)](https://www.npmjs.com/package/rosetta-date)
[![CI](https://img.shields.io/github/actions/workflow/status/JoaoPedroAS51/rosetta-date/ci.yml?branch=main&label=CI)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlejs/size/rosetta-date?label=bundle%20%28gzip%29)](https://bundlejs.com/?q=rosetta-date)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`rosetta-date` translates date-format strings between formatting languages by routing every token through a canonical intermediate representation before rendering it into the target language.

```ts
import { convert } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'

convert('YYYY-MM-DD', { from: moment, to: ldml }) // 'yyyy-MM-dd'
```

Although `YYYY-MM-DD` and `yyyy-MM-dd` look different, they express the same date format using different formatting languages. `rosetta-date` rewrites the tokens — not the date.

## Highlights

- 🔁 **Bidirectional** — every mapping works in both directions.
- 🧭 **Canonical semantic model** — tokens convert through a shared meaning, never dialect-to-dialect.
- 🧩 **Extensible by design** — a new dialect or library connects to the hub with two mappings, not a fleet of pairwise converters.
- 🪶 **Zero runtime dependencies**.
- 🌳 **Tree-shakeable** — dialects and libraries ship from their own entrypoints.
- 🛡️ **Escape-aware tokenizer** — literals round-trip intact across dialects.

## Documentation

This README is a quick start. The **[full documentation](https://rosetta-date.vercel.app)** covers everything else:

- [How it works](https://rosetta-date.vercel.app/concepts/how-it-works) — the canonical model behind every conversion.
- [Dialects & Libraries](https://rosetta-date.vercel.app/concepts/dialects-and-libraries) — when to use which.
- [Custom dialects & libraries](https://rosetta-date.vercel.app/guides/custom-dialects) — teach it a new ecosystem.
- [Unsupported tokens](https://rosetta-date.vercel.app/guides/unsupported-tokens) — what happens when a token has no clean target.
- [Token mapping](https://rosetta-date.vercel.app/reference/token-mapping) — the full per-token grammar tables.
- [Library notes](https://rosetta-date.vercel.app/reference/library-notes) — tool-specific coverage and caveats.
- [API reference](https://rosetta-date.vercel.app/reference/api) — every export, signature, and type.

## Install

```bash
npm install rosetta-date
```

<details><summary>pnpm / yarn / bun</summary>

```bash
pnpm add rosetta-date
yarn add rosetta-date
bun add rosetta-date
```

</details>

**Requirements:** Node ≥ 22, and an ESM project — `import` the package; do not `require()` it.

## Usage

The conversion API lives at the package root; **dialects** and **libraries** are imported from their own
entrypoints and passed in.

```ts
import { convert, createConverter } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'

// One-off, direction travels with the call:
convert('DD/MM/YYYY', { from: moment, to: ldml }) // 'dd/MM/yyyy'
convert('yyyy-MM-dd', { from: ldml, to: moment }) // 'YYYY-MM-DD'

// Fixed direction reused many times — bind once, call often:
const toLdml = createConverter(moment, ldml)
toLdml('YYYY-MM-DD') // 'yyyy-MM-dd'
toLdml('hh:mm A') // 'hh:mm a'
```

A `Dialect` is a formatting language (grammar + literals); a `Library` models one tool on top of a
dialect (the tokens it renders, its aliases, its limits). `from` and `to` each take either, so you can
mix them freely. Converting *to* a library flags tokens it cannot render:

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

See [Converting](https://rosetta-date.vercel.app/guides/converting), [Dialects & Libraries](https://rosetta-date.vercel.app/concepts/dialects-and-libraries),
and [Custom dialects & libraries](https://rosetta-date.vercel.app/guides/custom-dialects) for the full guides.

## Supported dialects & libraries

**Dialects** — at `rosetta-date/dialects`:

| Dialect  | Grammar                                                          | Example      | Literals |
| -------- | ---------------------------------------------------------------- | ------------ | -------- |
| `moment` | [Moment.js][momentjs-docs] token grammar                         | `DD/MM/YYYY` | `[...]`  |
| `ldml`   | [Unicode Technical Standard #35 / LDML][ldml] date field symbols | `dd/MM/yyyy` | `'...'`  |

**Libraries** — at `rosetta-date/libraries`:

| Library    | Tool                       | Speaks   | Coverage                                                                                                          |
| ---------- | -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `momentjs` | [Moment.js][momentjs-docs] | `moment` | the full grammar                                                                                                  |
| `dayjs`    | [Day.js][dayjs-docs]       | `moment` | a core subset + the common plugins (AdvancedFormat, LocalizedFormat)                                              |
| `dateFns`  | [date-fns][date-fns-docs]  | `ldml`   | the full grammar **+ its own extensions** (`P…`, `t`/`T`, `R`/`I`/`i`); some tokens gated behind date-fns options |

The per-token grammar tables are in [Token mapping](https://rosetta-date.vercel.app/reference/token-mapping); tool-specific
behaviour is in [Library notes](https://rosetta-date.vercel.app/reference/library-notes).

## How it works

`rosetta-date` never converts one dialect directly into another. Every token is first mapped to a **canonical
semantic representation** — what it *means*, independent of any dialect — and only then rendered into the target:

```text
Source Library  →  Source Dialect  →  Canonical Representation  →  Target Dialect  →  Target Library
```

Because every dialect maps to and from that one shared vocabulary, a dialect needs only **two** mappings to
interoperate with all the others, and the engine stays the single place that has to be correct. That is what makes
the model extensible: a new ecosystem connects to the canonical hub, not to every dialect that already exists.

## Contributing

Contributions are welcome. The [Contributing guide](https://rosetta-date.vercel.app/contributing) covers local setup, the
project scripts, the testing layout, and how to add a new dialect or library.

## License

[MIT](./LICENSE) © João Pedro Antunes Silva

[date-fns-docs]: https://date-fns.org/docs/format
[dayjs-docs]: https://day.js.org/docs/en/display/format
[ldml]: https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
[momentjs-docs]: https://momentjs.com/docs/#/displaying/format/
