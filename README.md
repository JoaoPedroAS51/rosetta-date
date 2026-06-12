# rosetta-date

> Bidirectionally convert date-format token strings between **dialects** (`moment`, `ldml`) and the **libraries** that speak them (Moment.js, Day.js, date-fns).

[![npm version](https://img.shields.io/npm/v/rosetta-date.svg)](https://www.npmjs.com/package/rosetta-date)
[![CI](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml/badge.svg)](https://github.com/JoaoPedroAS51/rosetta-date/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`rosetta-date` translates date-format token strings between **dialects** (token grammars) — and the **libraries**
that speak them — through a neutral canonical model: each dialect maps to and from a shared semantic vocabulary,
so conversion stays **bidirectional** and consistent, and **a new dialect or library is added without touching the
engine**. The dialects and libraries below are what ship today; the design is built to grow.

Routing through that canonical hub is what keeps the case-sensitive traps straight — moment `DD` (day of month)
becomes ldml `dd`, never `DD` (which in LDML is day of *year*).

- **Zero runtime dependencies**
- **ESM-only**, ships with types
- **Escape-aware tokenizer** (longest-token-first), handling `moment` `[literals]` and `ldml` `'literals'`

## Supported dialects & libraries

A **dialect** is a token grammar; a **library** is a concrete tool that *speaks* a dialect — rendering some subset
of it, and sometimes **adding its own tokens** on top (see [date-fns extensions](#date-fns-extensions)). Convert
between **dialects** for pure grammar-level translation, or between **libraries** to also flag tokens the target
tool would mishandle and pick up its extensions. Both are importable objects, and you can add your own.

**Dialects** — at `rosetta-date/dialects`:

- **`moment`** — the Moment.js token grammar (e.g. `DD/MM/YYYY`), literals in `[...]`.
- **`ldml`** — the [Unicode Technical Standard #35 / LDML](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
  date field symbols (e.g. `dd/MM/yyyy`), literals in `'...'`.

**Libraries** — at `rosetta-date/libraries`:

| Library | Speaks | Coverage |
| --- | --- | --- |
| `momentjs` ([Moment.js](https://momentjs.com/docs/#/displaying/format/)) | `moment` | the full grammar |
| `dayjs` ([Day.js](https://day.js.org/docs/en/display/format)) | `moment` | a core subset + the common plugins (AdvancedFormat, LocalizedFormat) |
| `dateFns` ([date-fns](https://date-fns.org/docs/format)) | `ldml` | the full grammar **+ its own extensions** (`P…`, `t`/`T`, `R`/`I`/`i`); some tokens gated behind date-fns options |

So translating a Day.js format to a date-fns format is converting from the `moment` dialect to the `ldml`
dialect — or, naming the tools directly, `from: dayjs` to `to: dateFns`.

## Install

```bash
pnpm add rosetta-date
```

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
spell through `onUnsupportedToken` (below). A reference implementation (`momentjs`, `dateFns`) renders its whole
dialect. Plain `dialect → dialect` conversion is unchanged and equally first-class.

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
field, but the target *library* does not render it), or **requires-plugin / -flag / -env** (the library renders it
only under a condition you did not [`assume`](#capabilities--assume)). The `onUnsupportedToken` option decides what
happens:

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

The default never throws — every token is preserved, as a literal at worst.

### Capabilities & `assume`

A library renders some tokens only under a condition — Day.js needs a plugin for `Q`/`L`, date-fns needs an option
for `YYYY`/`D`, Moment.js needs `moment-timezone` for `z`. Each token carries a *capability*. Conversion is
**optimistic** by default (every condition is assumed met, so output is unchanged); pass `assume` to declare what
the target actually has, and a token whose condition is missing is routed through `onUnsupportedToken`:

```ts
import { convert } from 'rosetta-date'
import { dayjs, momentjs } from 'rosetta-date/libraries'

convert('Q L', { from: momentjs, to: dayjs }) // 'Q L' (both plugins assumed)
convert('Q L', { from: momentjs, to: dayjs, assume: { plugins: ['advancedFormat'] } }) // 'Q [L]' — L needs LocalizedFormat
```

`assume` has three lists, `{ plugins, flags, env }`. An unmet condition surfaces as a `requires-plugin`,
`requires-flag`, or `requires-env` reason, with `info.requires` (and `UnsupportedTokenError.requires`) naming it:

```ts
import { convert } from 'rosetta-date'
import { dateFns, momentjs } from 'rosetta-date/libraries'

convert('gggg', { from: momentjs, to: dateFns, assume: { flags: [] }, onUnsupportedToken: 'throw' })
// throws — reason 'requires-flag', requires 'useAdditionalWeekYearTokens'
```

With no `assume`, none of this triggers — it is purely opt-in strictness. But providing `assume` at all switches
optimism off for *every* kind: an omitted (or empty) list means no condition of that kind is met, so
`{ plugins: ['advancedFormat'] }` still flags every flag- and env-gated token.

## Token mapping

The tables below list the tokens that round-trip between dialects.

### Era & year

| Meaning | `moment` | `ldml` |
| --- | --- | --- |
| Era, abbreviated | `N` | `GGG` |
| Era, wide | `NNNN` | `GGGG` |
| Era, narrow | `NNNNN` | `GGGGG` |
| Calendar year | `YYYY` | `yyyy` |
| Calendar year, 2-digit | `YY` | `yy` |
| Local week-numbering year | `gggg` | `YYYY` |
| Local week-numbering year, 2-digit | `gg` | `YY` |

### Month & quarter

| Meaning | `moment` | `ldml` |
| --- | --- | --- |
| Quarter | `Q` | `Q` |
| Quarter, ordinal | `Qo` | `Qo` |
| Month | `M` | `M` |
| Month, 2-digit | `MM` | `MM` |
| Month, ordinal | `Mo` | `Mo` |
| Month, abbreviated | `MMM` | `MMM` |
| Month, wide | `MMMM` | `MMMM` |

### Week & day

| Meaning | `moment` | `ldml` |
| --- | --- | --- |
| Week of year | `w` | `w` |
| Week of year, 2-digit | `ww` | `ww` |
| Week of year, ordinal | `wo` | `wo` |
| Day of month | `D` | `d` |
| Day of month, 2-digit | `DD` | `dd` |
| Day of month, ordinal | `Do` | `do` |
| Day of year | `DDD` | `D` |
| Day of year, 3-digit | `DDDD` | `DDD` |
| Day of year, ordinal | `DDDo` | `Do` |

### Weekday

| Meaning | `moment` | `ldml` |
| --- | --- | --- |
| Weekday, abbreviated | `ddd` | `EEE` |
| Weekday, wide | `dddd` | `EEEE` |
| Weekday, short | `dd` | `EEEEEE` |
| Weekday, number | `d` | `e` |

### Time

| Meaning | `moment` | `ldml` |
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

### Time zone

| Meaning | `moment` | `ldml` |
| --- | --- | --- |
| Time-zone name | `z` | `zzz` |
| Offset, `±hh:mm` | `Z` | `xxx` |
| Offset, `±hhmm` | `ZZ` | `xx` |

### Aliases

A few extra spellings are **parsed** but normalize to the primary token above when rendered:

- `moment` `Y` → calendar year (like `YYYY`).
- `ldml` `y` / `yyy` → calendar year; `EE` → abbreviated weekday; `aa` / `aaa` → AM/PM;
  `z` / `zz` → time-zone name.

## date-fns extensions

date-fns adds tokens on top of the `ldml` (UTS#35) grammar — ISO week fields, the
Unix epoch, and the localized presets. They convert through the **`dateFns`**
library (`from: momentjs, to: dateFns`); the bare `ldml` dialect does not define
them, so a `dialect → dialect` conversion literalizes them instead.

| Meaning | `momentjs` | `dateFns` |
| --- | --- | --- |
| ISO week-numbering year | `GGGG` | `RRRR` |
| ISO week-numbering year, 2-digit | `GG` | `RR` |
| ISO week of year | `W` | `I` |
| ISO week of year, 2-digit | `WW` | `II` |
| ISO week of year, ordinal | `Wo` | `Io` |
| ISO weekday, number | `E` | `i` |
| Unix timestamp, seconds | `X` | `t` |
| Unix timestamp, milliseconds | `x` | `T` |

### Localized presets

`L…` (Moment.js) and `P…`/`p…` (date-fns) render **per the library's loaded
locale**. `rosetta-date` maps them **preset → preset** (never to a concrete
pattern), so the token stays locale-deferred and the target library applies its own
locale — including the compound connector (`" at "`, `", "`, …) it picks for that
locale.

| Meaning | `momentjs` | `dateFns` |
| --- | --- | --- |
| Date, short | `L` | `P` |
| Date, medium | `ll` | `PP` |
| Date, long | `LL` | `PPP` |
| Time, short | `LT` | `p` |
| Time, with seconds | `LTS` | `pp` |
| Date + time, medium | `lll` | `PPpp` |
| Date + time, long | `LLL` | `PPPppp` |
| Date + time, full | `LLLL` | `PPPPpppp` |

> **Locale caveat:** conversion rewrites the token, not the date. Matching *output*
> needs equivalent locales loaded in both libraries; the conversion only guarantees
> the token stays the locale's preset, never a hardcoded pattern. Samples are en-US
> — e.g. `LL` vs `PPP` differ only as `June 7, 2024` vs `June 7th, 2024`, which is
> each library's en locale data, not a conversion error.
>
> **Match widths:** for date + time, use a matched compound preset (`PPpp`,
> `PPPppp`) or a separator (`PP p`). moment has no mismatched-width compound, so
> gluing different widths (`PPPp`) drops the locale connector and can re-lex into a
> different token — `rosetta-date` maps each preset faithfully, but the glued input
> is "garbage in".

## Non-round-trippable tokens

Some tokens have no `moment` counterpart, so converting them **to moment** produces
an escaped literal (e.g. `MMMMM` → `[MMMMM]`) rather than a wrong guess.

Pure `ldml` dialect:

| `ldml` | Meaning |
| --- | --- |
| `MMMMM` | Narrow month |
| `EEEEE` | Narrow weekday |
| `aaaa` `aaaaa` | Wide / narrow day period |
| `K` `KK` | Hour 0–11 |
| `DD` | Day of year, 2-digit |

date-fns extensions:

| `dateFns` | Meaning |
| --- | --- |
| `PPPP` | Localized full date (with weekday) |
| `ppp` `pppp` | Localized time with time zone |
| `Pp` | Localized short date + time |

Also note: `moment` `d` (weekday number, `0`–`6`) and `ldml` `e` (locale-dependent) map to each other but use
different numbering; the AM/PM marker loses its moment casing (`A`/`a` both become `a`); and moment's narrow era
(`NNNNN`) renders the abbreviation (`AD`), not a true one-character form.

## date-fns gotchas

date-fns guards a few tokens behind options you must enable in its `format()` call:

- Day of year (`D`, `DD`) requires `useAdditionalDayOfYearTokens: true`.
- Local week-year (`YY`, `YYYY`) requires `useAdditionalWeekYearTokens: true`.

`rosetta-date` produces the standards-correct token; enabling these options is the caller's responsibility. The
`dateFns` library carries them as [capabilities](#capabilities--assume), so converting with `assume: { flags: [] }`
makes `rosetta-date` flag the tokens that would otherwise need an option.

## Literals

Literal (verbatim) text is preserved across dialects:

- `moment` brackets `[...]` ↔ `ldml` quotes `'...'`.
- A literal apostrophe is `''` in `ldml` (e.g. `'o''clock'` → `o'clock`).
- Only the letter-bearing span is escaped, so separators stay clean: `DD/MM` ↔ `dd/MM`, not `dd'/'MM`.

## License

[MIT](./LICENSE) © João Pedro Antunes Silva
