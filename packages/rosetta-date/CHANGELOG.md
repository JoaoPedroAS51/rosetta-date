# rosetta-date

## 0.2.0

### Minor Changes

- d7f3fbe: Add `defineDialect`, a definition-time helper mirroring `defineLibrary`. It validates a dialect (rejecting duplicate token spellings and incoherent literal rules) and returns a stable object to reuse across conversions.
- aea79e4: Export the canonical vocabulary so `defineDialect` and `defineLibrary({ extends })` are usable from outside the package. `Canonical` (and the `CanonicalToken`, `TokenRule`, `LiteralRules` types) are now part of the public API at the package root; their `field/style` string values are covered by semver.

## 0.1.0

Initial release — a zero-dependency, ESM-only TypeScript library that
bidirectionally converts date-format token strings between **dialects** and the
**libraries** that speak them, routed through a neutral canonical model.

### Conversion

- `convert(format, { from, to })` and `createConverter(from, to)` translate token
  strings in both directions; `from`/`to` accept a `Dialect` **or** a `Library`.
- Two dialects at `rosetta-date/dialects`: **`moment`** (Moment.js grammar) and
  **`ldml`** (UTS#35 / LDML). Routing through the canonical hub keeps the
  case-sensitive traps correct — moment `DD` (day of month) → ldml `dd`, never
  `DD` (day of year).
- Escape-aware, longest-token-first tokenizer with minimal literal escaping
  (`[...]` ↔ `'...'`, `''` for an embedded quote).
- Round-trip-safe token boundaries: adjacent tokens that would re-merge in the
  target (e.g. `LL` + `LT` → `LLLT`) are separated with the target's empty literal
  (`LL[]LT`), or flagged `unrepresentable-adjacency` when it has none.
- Token coverage: era, calendar & week-numbering year, quarter, month, week & day
  (including ordinals), weekday, hours/minutes/seconds, fractional seconds, and
  time zone / offset.

### Libraries

- **`momentjs`**, **`dayjs`**, and **`dateFns`** at `rosetta-date/libraries` —
  each a `Dialect` plus the subset of tokens it actually renders. Converting
  library → library flags tokens the target would silently mishandle (e.g. Day.js
  mangling `Mo` → `6o`) as `unsupported-by-target`.
- date-fns extensions over LDML — localized presets (`P…`/`p…`), the Unix epoch
  (`t`/`T`), and ISO fields (`R`/`I`/`i`) — ship through the `dateFns` library.
- `defineLibrary` to declare your own.

### Localized presets

- moment `L…` ↔ date-fns `P…`/`p…` map **preset → preset** (locale-deferred,
  never a hardcoded pattern), including the compound date-and-time tokens, so each
  library applies its own locale connector at format time.

### Unsupported-token policy

- `onUnsupportedToken`: `'literalize'` (default — never throws), `'throw'`
  (`UnsupportedTokenError`), or a handler. `Unsupported.drop` /
  `Unsupported.literalize` sentinels express handler intent.
- Reasons: `unrecognized`, `unmappable`, `unsupported-by-target`, and
  `unrepresentable-adjacency`.
- A handler's `info` carries the `reason`, the resolved `from`/`to` dialects, and
  `fromLibrary`/`toLibrary` — the `Library` endpoints, so it can tell libraries
  that share a dialect (e.g. `dayjs` vs `momentjs`) apart.

### Packaging

- Zero runtime dependencies, ESM-only, ships types.
- Tree-shakeable: pass dialect/library objects (no central registry), with
  `rosetta-date/dialects` and `rosetta-date/libraries` subpath exports.
- Node ≥ 22.
