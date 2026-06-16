# rosetta-date

> Bidirectionally convert date-format token strings between **dialects** (`moment`, `ldml`) and the **libraries** that speak them (Moment.js, Day.js, date-fns).

[![npm version](https://img.shields.io/npm/v/rosetta-date.svg)](https://www.npmjs.com/package/rosetta-date)
[![CI](https://img.shields.io/github/actions/workflow/status/JoaoPedroAS51/rosetta-date/ci.yml?branch=main&label=CI)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlejs/size/rosetta-date?label=bundle%20%28gzip%29)](https://bundlejs.com/?q=rosetta-date)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Overview

`rosetta-date` routes every token through a neutral canonical model. Each dialect maps to and from one shared
vocabulary, so conversion stays **bidirectional** and a new dialect or library drops in without touching the engine.

That canonical hub keeps the case-sensitive traps straight: moment `DD` (day of month) becomes ldml `dd`, never
LDML `DD`, which is day of *year*.

- **Zero runtime dependencies**
- **ESM-only**, ships with types
- **Escape-aware tokenizer** (longest-token-first), handling each dialect's literal syntax (e.g. `moment`
  `[literals]`, `ldml` `'literals'`)

## Contents

- [Supported dialects & libraries](#supported-dialects--libraries)
- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
  - [Dialects and libraries are objects (tree-shakeable)](#dialects-and-libraries-are-objects-tree-shakeable)
  - [Unsupported tokens](#unsupported-tokens)
- [Token mapping](#token-mapping)
  - [Tokens with no `moment` counterpart](#tokens-with-no-moment-counterpart)
  - [Literals](#literals)
  - [Adjacent tokens](#adjacent-tokens)
- [Library notes](#library-notes)
  - [momentjs](#momentjs)
  - [dayjs](#dayjs)
  - [dateFns](#datefns)
- [Contributing](#contributing)
- [License](#license)

## Supported dialects & libraries

A **dialect** is a token grammar; a **library** is a concrete tool that *speaks* a dialect — rendering some subset
of it, and sometimes **adding its own tokens** on top. Both are importable objects, and you can add your own.

**Dialects** — at `rosetta-date/dialects`:

| Dialect  | Grammar                                                          | Example      | Literals |
| -------- | ---------------------------------------------------------------- | ------------ | -------- |
| `moment` | Moment.js token grammar                                          | `DD/MM/YYYY` | `[...]`  |
| `ldml`   | [Unicode Technical Standard #35 / LDML][ldml] date field symbols | `dd/MM/yyyy` | `'...'`  |

**Libraries** — at `rosetta-date/libraries`:

| Library    | Tool                                                        | Speaks   | Coverage                                                                                                          |
| ---------- | ----------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `momentjs` | [Moment.js](https://momentjs.com/docs/#/displaying/format/) | `moment` | the full grammar                                                                                                  |
| `dayjs`    | [Day.js](https://day.js.org/docs/en/display/format)         | `moment` | a core subset + the common plugins (AdvancedFormat, LocalizedFormat)                                              |
| `dateFns`  | [date-fns](https://date-fns.org/docs/format)                | `ldml`   | the full grammar **+ its own extensions** (`P…`, `t`/`T`, `R`/`I`/`i`); some tokens gated behind date-fns options |

A library wraps a dialect, so converting between libraries does everything a dialect-to-dialect conversion does
*and more*. For example, translating a Day.js format to a date-fns format with `from: dayjs, to: dateFns` runs the
same underlying grammar translation as the corresponding dialect pair (`from: moment, to: ldml`), then layers on
the library knowledge — flagging tokens Day.js can't render and picking up date-fns's extensions. Use **dialects**
for pure grammar translation; use **libraries** when the source or target tool's limits matter.

## Requirements

- **Node ≥ 22.**
- **ESM-only** — `import` the package; do not `require()` it.

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

## Usage

```ts
import { convert, createConverter } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'

// One-off, direction travels with the call:
convert('DD/MM/YYYY', { from: moment, to: ldml }) // 'dd/MM/yyyy'
convert('yyyy-MM-dd', { from: ldml, to: moment }) // 'YYYY-MM-DD'

// Fixed direction reused many times — bind once, call often:
const toDateFns = createConverter(moment, ldml)
toDateFns('YYYY-MM-DD') // 'yyyy-MM-dd'
toDateFns('hh:mm A') // 'hh:mm a'
```

`createConverter` returns a plain `(format: string) => string`, handy to store or pass around as a callback.

### Dialects and libraries are objects (tree-shakeable)

The conversion API lives at `rosetta-date`; **dialects** at `rosetta-date/dialects`, **libraries** at
`rosetta-date/libraries`. `from` and `to` each take a `Dialect` *or* a `Library` — mix them freely. Passing them
in keeps the conversion functions free of a central registry, so a bundle that uses only one pair tree-shakes the
rest — and you can pass a **custom `Dialect`**, or a `Library` you build with `defineLibrary`.

> **Define a custom dialect or library once and reuse that object.** Per-dialect compilation is cached by object
> identity, so constructing a fresh `{ name, literal, tokens }` (or calling `defineLibrary`) on every `convert`
> call silently misses the cache and recompiles each time. The built-in dialects and libraries are already shared
> singletons.

```ts
import { convert, createConverter } from 'rosetta-date'
import { dateFns, dayjs, momentjs } from 'rosetta-date/libraries'

// Convert lib → lib (reads like the intent):
convert('DD/MM/YYYY', { from: momentjs, to: dateFns }) // 'dd/MM/yyyy'

// Same grammar, different tool — flags what the target can't render. Day.js
// would mangle `Mo` to `6o`, so a strict converter throws instead of emitting it:
const safeForDayjs = createConverter(momentjs, dayjs, { onUnsupportedToken: 'throw' })
safeForDayjs('YYYY-MM-DD') // 'YYYY-MM-DD'
safeForDayjs('Mo') // throws UnsupportedTokenError (reason: 'unsupported-by-target')
```

A `Library` is a `Dialect` plus the subset of tokens it renders; converting *to* one routes any token it cannot
spell through `onUnsupportedToken` (below). A reference implementation (e.g. `momentjs`, `dateFns`) renders its
whole dialect. Plain `dialect → dialect` conversion is unchanged and equally first-class.

For a name-driven path (e.g. an endpoint chosen from config), `getDialect` / `getLibrary` resolve a name to its
object. By design each reference pulls in every built-in, so reach for it only when the direction is dynamic:

```ts
import { convert } from 'rosetta-date'
import { getDialect } from 'rosetta-date/dialects'
import { getLibrary } from 'rosetta-date/libraries'

convert(format, { from: getDialect(config.from), to: getLibrary(config.to) })
```

### Unsupported tokens

A token can lack a clean conversion: it is **unrecognized** (the source dialect does not define it), **unmappable**
(a valid source field with no token in the target dialect), **unsupported-by-target** (the target dialect has the
field, but the target *library* does not render it — e.g. Day.js mangling `Mo`), or **unrepresentable-adjacency**
(the token converts, but it would merge with its neighbour and the target dialect has no empty literal to separate
them — see [Adjacent tokens](#adjacent-tokens)). The `onUnsupportedToken` option decides what happens:

```ts
import { convert, Unsupported, UnsupportedTokenError } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'

// 'literalize' (default) — escape it as a literal, so it can never be re-read as a token:
convert('K', { from: ldml, to: moment }) // '[K]'

// 'throw' — fail fast (handy for migrations/validation):
convert('K', { from: ldml, to: moment, onUnsupportedToken: 'throw' }) // throws UnsupportedTokenError

// handler — decide per token:
convert('K', {
  from: ldml,
  to: moment,
  onUnsupportedToken: (token, info) =>
    info.reason === 'unmappable' ? Unsupported.drop : Unsupported.literalize,
})
```

A handler's return value is emitted **verbatim**; use the `Unsupported` sentinels to express intent:
`Unsupported.drop` omits the token, `Unsupported.literalize` defers to the default. (`''` and `undefined` are
accepted as equivalents.)

The `info` argument carries the `reason`, the resolved `from` / `to` **dialects**, and — when an endpoint was a
`Library` — the `fromLibrary` / `toLibrary` it resolved from. Since libraries that share a dialect (Day.js and
Moment.js both speak `moment`) resolve to the same `to`, `toLibrary` is how a handler tells them apart.

The default never throws — every token is preserved, as a literal at worst.

<details><summary>What the supports set does not cover</summary>

A `Library`'s `supports` set is "what tokens this tool can render" (used to flag `unsupported-by-target`). It
does **not** model the consumer's runtime configuration: a token a library renders only with a plugin or option
loaded (Day.js's `Q`, date-fns's `D`) is emitted as-is. Whether that plugin or option is actually enabled is the
target library's concern, and it signals the problem itself at format time — date-fns throws, Day.js mangles. See
[dayjs](#dayjs) and [dateFns](#datefns) under Library notes.

</details>

## Token mapping

This section is the **grammar layer** — what translates between dialects, independent of any tool. Behaviour
specific to a concrete library lives in [Library notes](#library-notes).

The tables below list the tokens that round-trip between dialects.

### Era & year

| Meaning                            | `moment` | `ldml`  |
| ---------------------------------- | -------- | ------- |
| Era, abbreviated                   | `N`      | `GGG`   |
| Era, wide                          | `NNNN`   | `GGGG`  |
| Era, narrow                        | `NNNNN`  | `GGGGG` |
| Calendar year                      | `YYYY`   | `yyyy`  |
| Calendar year, 2-digit             | `YY`     | `yy`    |
| Local week-numbering year          | `gggg`   | `YYYY`  |
| Local week-numbering year, 2-digit | `gg`     | `YY`    |

### Month & quarter

| Meaning            | `moment` | `ldml` |
| ------------------ | -------- | ------ |
| Quarter            | `Q`      | `Q`    |
| Quarter, ordinal   | `Qo`     | `Qo`   |
| Month              | `M`      | `M`    |
| Month, 2-digit     | `MM`     | `MM`   |
| Month, ordinal     | `Mo`     | `Mo`   |
| Month, abbreviated | `MMM`    | `MMM`  |
| Month, wide        | `MMMM`   | `MMMM` |

### Week & day

| Meaning               | `moment` | `ldml` |
| --------------------- | -------- | ------ |
| Week of year          | `w`      | `w`    |
| Week of year, 2-digit | `ww`     | `ww`   |
| Week of year, ordinal | `wo`     | `wo`   |
| Day of month          | `D`      | `d`    |
| Day of month, 2-digit | `DD`     | `dd`   |
| Day of month, ordinal | `Do`     | `do`   |
| Day of year           | `DDD`    | `D`    |
| Day of year, 3-digit  | `DDDD`   | `DDD`  |
| Day of year, ordinal  | `DDDo`   | `Do`   |

### Weekday

| Meaning              | `moment` | `ldml`   |
| -------------------- | -------- | -------- |
| Weekday, abbreviated | `ddd`    | `EEE`    |
| Weekday, wide        | `dddd`   | `EEEE`   |
| Weekday, short       | `dd`     | `EEEEEE` |
| Weekday, number      | `d`      | `e`      |

### Time

| Meaning                        | `moment`       | `ldml`         |
| ------------------------------ | -------------- | -------------- |
| AM/PM                          | `A`            | `a`            |
| Hour 1–12                      | `h`            | `h`            |
| Hour 1–12, 2-digit             | `hh`           | `hh`           |
| Hour 0–23                      | `H`            | `H`            |
| Hour 0–23, 2-digit             | `HH`           | `HH`           |
| Hour 1–24                      | `k`            | `k`            |
| Hour 1–24, 2-digit             | `kk`           | `kk`           |
| Minute                         | `m`            | `m`            |
| Minute, 2-digit                | `mm`           | `mm`           |
| Second                         | `s`            | `s`            |
| Second, 2-digit                | `ss`           | `ss`           |
| Fractional second (1–3 digits) | `S` `SS` `SSS` | `S` `SS` `SSS` |

### Time zone

| Meaning          | `moment` | `ldml` |
| ---------------- | -------- | ------ |
| Time-zone name   | `z`      | `zzz`  |
| Offset, `±hh:mm` | `Z`      | `xxx`  |
| Offset, `±hhmm`  | `ZZ`     | `xx`   |

### Aliases

A few extra spellings are **parsed** but normalize to the primary token above when rendered:

- `moment` `Y` → calendar year (like `YYYY`).
- `ldml` `y` / `yyy` → calendar year; `EE` → abbreviated weekday; `aa` / `aaa` → AM/PM;
  `z` / `zz` → time-zone name.

### Tokens with no `moment` counterpart

Some `ldml` tokens have no `moment` counterpart, so converting them **to moment** produces an escaped literal
(e.g. `MMMMM` → `[MMMMM]`) rather than a wrong guess.

| `ldml`         | Meaning                  |
| -------------- | ------------------------ |
| `MMMMM`        | Narrow month             |
| `EEEEE`        | Narrow weekday           |
| `aaaa` `aaaaa` | Wide / narrow day period |
| `K` `KK`       | Hour 0–11                |
| `DD`           | Day of year, 2-digit     |

Also note: `moment` `d` (weekday number, `0`–`6`) and `ldml` `e` (locale-dependent) map to each other but use
different numbering; the AM/PM marker loses its moment casing (`A`/`a` both become `a`); and moment's narrow era
(`NNNNN`) renders the abbreviation (`AD`), not a true one-character form.

> date-fns adds extension tokens that also have no `moment` counterpart (`PPPP`, `Pp`, …). Those live with the
> rest of the date-fns extensions under [dateFns](#datefns).

### Literals

Literal (verbatim) text is preserved across dialects:

- `moment` brackets `[...]` ↔ `ldml` quotes `'...'`.
- A literal apostrophe is `''` in `ldml` (e.g. `'o''clock'` → `o'clock`).
- Only the letter-bearing span is escaped, so separators stay clean: `DD/MM` ↔ `dd/MM`, not `dd'/'MM`.
- A literal `]` has no in-band escape inside a moment `[...]` run, so it is emitted *between* bracketed spans
  (e.g. `a]b` → `[a]][b]`); the text still round-trips intact.

### Adjacent tokens

Output is **round-trip-safe at the token boundary**: two adjacent tokens never silently re-merge into a different
token when read back. When a conversion would place tokens that collide — e.g. date-fns `PPPp` (a long date next to
a short time) becomes moment `LL` + `LT`, and `LLLT` would re-read as `LLL` + `T` — they are separated with the
target dialect's **empty literal**:

```ts
import { convert } from 'rosetta-date'
import { dateFns, momentjs } from 'rosetta-date/libraries'

convert('PPPp', { from: dateFns, to: momentjs }) // 'LL[]LT' — '[]' keeps LL and LT apart
```

A quote-style dialect like `ldml` has no empty literal (`''` is a literal apostrophe, not nothing), so it cannot
express such an adjacency. There the second token is routed through `onUnsupportedToken` as
`unrepresentable-adjacency` — the default emits it anyway (matching the merged output), while `'throw'` lets a mass
migration catch it.

## Library notes

Each library speaks one of the dialects above but renders its own slice of it — adding tokens, omitting others, or
gating some behind runtime configuration. Converting *between libraries* (rather than dialects) is what surfaces
these differences; see [Unsupported tokens](#unsupported-tokens) for how an unrenderable token is handled.

### momentjs

The reference implementation of the `moment` grammar. It renders every token in the [Token mapping](#token-mapping)
tables, so `momentjs` carries no `supports` set and converting *to* it never flags a grammar token. Its localized
`L…` presets map to date-fns `P…` — see [Localized presets](#localized-presets) under dateFns.

### dayjs

Day.js speaks the `moment` grammar but implements only a subset, split across its core formatter and two common
plugins. Tokens it does **not** recognize are *mangled* at format time (`Mo` → `6o`, `DDD` → `077`), so converting
*to* `dayjs` routes them through [`onUnsupportedToken`](#unsupported-tokens) (reason `unsupported-by-target`)
instead of emitting something broken — the [`safeForDayjs` example](#dialects-and-libraries-are-objects-tree-shakeable)
above shows the `'throw'` policy in action.

Tokens Day.js does not render (and therefore flags):

| Token(s)                      | Meaning                       |
| ----------------------------- | ----------------------------- |
| `N` `NN` `NNN` `NNNN` `NNNNN` | Era                           |
| `Mo` `Qo` `Wo` `DDDo`         | Ordinals beyond `Do` / `wo`   |
| `DDD` `DDDD`                  | Day of year                   |
| `e` `E`                       | Weekday number (locale / ISO) |
| `S` `SS`                      | Sub-`SSS` fractional second   |
| `gg` `GG`                     | Week-numbering year, 2-digit  |

Some tokens Day.js renders only with a plugin loaded — `Q`, `Do`, `w` / `wo` / `ww`, `W` / `WW`, `k` / `kk`,
`gggg` / `GGGG`, `X`, `x`, `z` need **AdvancedFormat**; the `L…` presets need **LocalizedFormat**. `rosetta-date`
emits these as-is; whether the plugin is actually loaded is the consumer's concern (the same boundary described for
[the `supports` set](#unsupported-tokens)).

### dateFns

date-fns is the reference implementation of the `ldml` (UTS#35) grammar **plus its own extensions** — ISO week
fields, the Unix epoch, and the localized presets. These extras convert only through the `dateFns` library
(`from: momentjs, to: dateFns`); the bare `ldml` dialect does not define them, so a `dialect → dialect` conversion
literalizes them instead.

| Meaning                          | `momentjs` | `dayjs` | `dateFns` |
| -------------------------------- | ---------- | ------- | --------- |
| ISO week-numbering year          | `GGGG`     | `GGGG`  | `RRRR`    |
| ISO week-numbering year, 2-digit | `GG`       | —       | `RR`      |
| ISO week of year                 | `W`        | `W`     | `I`       |
| ISO week of year, 2-digit        | `WW`       | `WW`    | `II`      |
| ISO week of year, ordinal        | `Wo`       | —       | `Io`      |
| ISO weekday, number              | `E`        | —       | `i`       |
| Unix timestamp, seconds          | `X`        | `X`     | `t`       |
| Unix timestamp, milliseconds     | `x`        | `x`     | `T`       |

`—` marks a date-fns extension Day.js has no token for; converting it *to* `dayjs` flags it (see [dayjs](#dayjs)).
The ones Day.js does render here come from its AdvancedFormat plugin.

#### Localized presets

`L…` (Moment.js) and `P…`/`p…` (date-fns) render **per the library's loaded locale**. `rosetta-date` maps them
**preset → preset** (never to a concrete pattern), so the token stays locale-deferred and the target library
applies its own locale — including the compound connector (`" at "`, `", "`, …) it picks for that locale.

| Meaning             | `momentjs` | `dayjs` | `dateFns`  |
| ------------------- | ---------- | ------- | ---------- |
| Date, short         | `L`        | `L`     | `P`        |
| Date, medium        | `ll`       | `ll`    | `PP`       |
| Date, long          | `LL`       | `LL`    | `PPP`      |
| Time, short         | `LT`       | `LT`    | `p`        |
| Time, with seconds  | `LTS`      | `LTS`   | `pp`       |
| Date + time, medium | `lll`      | `lll`   | `PPpp`     |
| Date + time, long   | `LLL`      | `LLL`   | `PPPppp`   |
| Date + time, full   | `LLLL`     | `LLLL`  | `PPPPpppp` |

Day.js renders these through its LocalizedFormat plugin.

> **Locale caveat:** conversion rewrites the token, not the date. Matching *output* needs equivalent locales loaded
> in both libraries; the conversion only guarantees the token stays the locale's preset, never a hardcoded pattern.
> Samples are en-US — e.g. `LL` vs `PPP` differ only as `June 7, 2024` vs `June 7th, 2024`, which is each library's
> en locale data, not a conversion error.
>
> **Match widths:** for date + time, use a matched compound preset (`PPpp`, `PPPppp`) or a separator (`PP p`).
> moment has no mismatched-width compound, so gluing different widths (`PPPp`) drops the locale connector and can
> re-lex into a different token — `rosetta-date` maps each preset faithfully, but the glued input is "garbage in".

#### Option-gated tokens

date-fns guards a few tokens behind options you must enable in its `format()` call:

- Day of year (`D`, `DD`) requires `useAdditionalDayOfYearTokens: true`.
- Local week-year (`YY`, `YYYY`) requires `useAdditionalWeekYearTokens: true`.

`rosetta-date` produces the standards-correct token; enabling these options is the caller's responsibility. The
converter does not track which options you enabled — if a token needs one you did not pass, date-fns throws at
`format()` time, which is the authoritative signal for your exact version.

#### Extensions with no `moment` counterpart

These date-fns extensions have no `moment` token, so converting them **to moment** produces an escaped literal
rather than a wrong guess:

| `dateFns`    | Meaning                            |
| ------------ | ---------------------------------- |
| `PPPP`       | Localized full date (with weekday) |
| `ppp` `pppp` | Localized time with time zone      |
| `Pp`         | Localized short date + time        |

## Contributing

### Local setup

Prerequisites: Node ≥ 22 and [pnpm](https://pnpm.io).

```bash
git clone https://github.com/JoaoPedroAS51/rosetta-date.git
cd rosetta-date
pnpm install
```

| Script                        | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `pnpm dev`                    | Rebuild on change (`tsdown --watch`).                |
| `pnpm build`                  | Emit the ESM bundle and types to `dist/`.            |
| `pnpm playground`             | Serve the interactive playground from `playground/`. |
| `pnpm typecheck`              | Type-check without emitting.                         |
| `pnpm lint` / `pnpm lint:fix` | Lint, and autofix, with the antfu config.            |
| `pnpm test`                   | Run the suite once.                                  |
| `pnpm test:coverage`          | Run with coverage, gated at 100%.                    |

The engine stays dialect-agnostic: every dialect maps to and from the shared canonical model. To add one, register
it in `src/dialects/registry.ts` (or a library in `src/libraries/registry.ts`) and give it a `test/fixtures.ts`
entry. The generic suites pick it up from there.

CI runs `lint`, `typecheck`, `test:coverage`, and `build` on every pull request. Record user-facing changes with a
changeset:

```bash
pnpm changeset
```

### Testing

Where a test lives signals what it covers.

| Location                   | Scope                                       | Examples                               |
| -------------------------- | ------------------------------------------- | -------------------------------------- |
| Beside the module (`src/`) | One module's units, in isolation            | `literal.test.ts` next to `literal.ts` |
| `test/`                    | Cross-cutting behavior across every dialect | `matrix.test.ts`, `round-trip.test.ts` |

Unit tests sit next to the code they exercise, so they travel with it on a refactor. The cross-cutting suites span
every dialect pair and derive from one shared oracle, `test/fixtures.ts`. Adding a dialect to the registry makes
TypeScript require its `fixtures.ts` entry, so the matrix and round-trip suites cover the new dialect automatically.

Run `pnpm test` for both, or `pnpm test:coverage` to enforce the 100% threshold.

## License

[MIT](./LICENSE) © João Pedro Antunes Silva

[ldml]: https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
