# rosetta-date

## 0.3.0

### Minor Changes

- b81bcf3: Fix the `date-fns` `RR` token. `R…` is zero-padded to width and never truncated,
  so `RR` is the full ISO week-year (an alias of `RRRR`), not a 2-digit year. It no
  longer maps to `WeekYearTwoDigitIso`. A truncated 2-digit ISO week-year (such as
  `moment`'s `GG`) now correctly falls to the unsupported-token policy when
  converting to `date-fns`, which has no equivalent token.

  Also fill two `ldml` grammar gaps: the bare `Y` / `YYY` local week-year (aliases
  of `YYYY`) and the `e`-form formatting weekday names `eee` … `eeeeee` (aliases of
  `EEE` … `EEEEEE`). Both flow to `date-fns`, which shares the `ldml` base.

- bbf2a97: **Breaking:** Model the lowercase day period. A new canonical
  `DayPeriodAbbreviatedLower` (`day-period/abbreviated/lower`) carries the
  forced-lowercase am/pm that some grammars bake into the spelling, added as
  `strftime`'s `%P` (glibc extension) and remapped onto `moment`'s `a`. The unmarked
  `DayPeriodAbbreviated` stays the de-facto uppercase default (`%p`, `A`), so there
  is no separate `upper`.

  This preserves case where both endpoints encode it (`a` ↔ `%P`) instead of
  silently dropping it, which changes existing output. `moment`'s `a` no longer
  normalizes to `A` — including on `moment`→`moment` round trips — and converting a
  lowercase day period to a grammar that cannot force lowercase (the `ldml` dialect,
  and the `date-fns` library built on it) now falls to the unsupported-token policy
  rather than emitting a default-cased token.

- 09f6cfd: Add `describe(format, endpoint)` — the read-only counterpart to `convert`. It
  parses a format string and returns its segments with the canonical semantics
  that conversion keeps internal: each recognized token decoded into its
  `field`/`style`/`qualifiers`, with literals and unrecognized runs passed through
  verbatim. Useful for docs, tooltips, and validation. The underlying
  `decodeCanonical` helper (and its `DecodedCanonical` type) is now public too.
- 4c002c2: Add `explain(format, { from, to })` — a read-only dry run of `convert`. It builds
  on `describe` and reports, per field, whether the target can render it and as
  which token (`status: 'converted'`, with `target`), or why it cannot
  (`status: 'unsupported'`, with `reason`). Literals and unrecognized runs pass
  through unchanged. Useful for migration audits — seeing what a conversion keeps,
  remaps, or drops before running it.
- a8ec064: Fix unrepresentable token adjacency to degrade honestly. When a target grammar
  cannot separate two adjacent tokens that would re-merge into a different token
  (for example two numeric quarters rendered into `ldml`, which has no zero-width
  separator), the second token now routes to the `onUnsupportedToken` policy like
  every other unrenderable token — literalized by default, or thrown/handled per the
  policy. Previously it was emitted verbatim, producing a silently wrong merged
  token (`Q` + `Q` read back as a 2-digit quarter).
- 7d87c1b: Add an `Intl.DateTimeFormat` adapter at `rosetta-date/intl`. `toIntlOptions`
  reads a format string into an `Intl.DateTimeFormatOptions` bag — the bridge from
  a hardcoded legacy pattern to native, locale-aware formatting. `fromIntlOptions`
  goes the other way, mapping the style axis (`dateStyle`/`timeStyle`) to the
  target's localized presets (`L`/`P`) so the library still resolves the locale at
  format time. Fields with no Intl equivalent are handled by `onUnsupportedToken`.
- e97265f: Recognize the LDML flexible day-period symbols `b` and `B` in `ldml` (and
  `date-fns`, which shares the base). `b` extends AM/PM with noon and midnight; `B`
  is the locale's flexible day ranges ("in the morning", "at night"). Both are
  modeled as a type qualifier on the day-period field across all three widths: six
  new canonicals, `day-period/{abbreviated,wide,narrow}/{extended,flexible}`.
  Converting them into a grammar that only has plain AM/PM falls to the
  unsupported-token policy rather than silently collapsing to `a`.
- 5bdfad6: Recognize the LDML numeric stand-alone forms in `ldml` (and `date-fns`, which
  shares the base): `L`/`LL` (month), `q`/`qq` (quarter), and `c`/`cc` (weekday).
  A numeric form carries no stand-alone inflection, so these alias the formatting
  numerics (`M`/`Q`/`e`) rather than getting their own canonicals; only the named
  stand-alone forms (`LLL`/`qqq`/`ccc`) stay distinct. A new `WeekdayTwoDigit`
  canonical (`weekday/2-digit`) backs the 2-digit weekday number `ee`/`cc`.
- 48c226d: **Breaking:** Move ordinal `...o` tokens out of the pure `ldml` dialect and into the `dateFns` library. Tokens such as `Mo`, `do`, `Qo`, `wo`, and `Do` are date-fns extensions, not bare LDML fields, so pure `ldml` conversions no longer treat them as built-in tokens.
- 28d1ea2: Recognize the LDML `Z`-for-zero offset symbols `XX` and `XXX` in `ldml` (and
  `date-fns`, which shares the base). These are the ISO 8601 offsets that emit `Z`
  at the zero (UTC) offset instead of a numeric `+0000`/`+00:00`. Two new canonicals
  model this as a `zulu` qualifier on the offset style: `offset/without-colon/zulu`
  (`XX`) and `offset/with-colon/zulu` (`XXX`). The `Intl` adapter reports them
  unsupported, since `Intl` cannot emit `Z` for the zero offset.
- 3bc3793: **Breaking:** `LibraryDefinition.supports` is now keyed by canonical field
  (`ReadonlySet<CanonicalToken>`) rather than token spelling (`ReadonlySet<string>`).
  A library now declares _which fields_ it renders, independent of how its dialect
  spells them, so aliases collapse to a single entry and the subset stays stable
  across spelling changes. `ResolvedLibrary.renders` correspondingly takes a
  `CanonicalToken`. `defineLibrary` validates `supports` against the fields the
  effective grammar can express.
- 59c556e: Add the quarter canonical fields `QuarterTwoDigit`, `QuarterAbbreviated`,
  `QuarterWide`, and `QuarterNarrow`, mapped to the LDML `QQ`/`QQQ`/`QQQQ`/`QQQQQ`
  tokens.
- 8f310c3: **Breaking:** Normalize canonical values to `field/style[/qualifier]`: the ISO
  week-numbering fields and the hour cycle are now trailing qualifiers instead of
  being baked into the field name. Members are renamed to match — a member's name is the PascalCase of
  its value — e.g. `IsoWeekYearNumeric` → `WeekYearNumericIso` (`week-year/numeric/iso`)
  and `Hour24Numeric` → `HourNumericH23` (`hour/numeric/h23`, matching the Intl hour
  cycle). The hour members `Hour12`/`Hour24`/`Hour24From1`/`Hour11` become
  `…H12`/`…H23`/`…H24`/`…H11`.
- 2c7dc30: Add the stand-alone (nominative) name fields for month, quarter, and weekday —
  `MonthWideStandalone`, `QuarterWideStandalone`, `WeekdayWideStandalone`, and their
  abbreviated/narrow (plus weekday short) siblings, ten in all — mapped to the LDML
  `LLL`/`qqq`/`ccc` token families. They preserve the grammatical-context distinction
  (a name used within a date vs. one shown on its own) that several languages inflect
  differently, instead of collapsing it onto the formatting forms.
- 37f03f9: **Breaking:** Model blank-padding as a `space-padded` qualifier on the width style
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

- 999a844: Add composite directives to the `strftime` dialect — `%T` (`%H:%M:%S`), `%R`
  (`%H:%M`), `%F` (`%Y-%m-%d`), `%D` (`%m/%d/%y`), and `%r` (`%I:%M:%S %p`). A
  composite is a parse-time macro: one spelling that expands to a sub-pattern, so
  `%T` parses exactly as `%H:%M:%S`. Rendering produces the expansion, never the
  composite, so a composite normalizes on a round trip (like an alias, across
  several tokens). Dialects can declare their own with the new optional
  `composites` field (`CompositeRule`), generic across syntax families.
- 0e638ec: Add the `strftime` dialect (C / POSIX `%`-directives) at `rosetta-date/dialects`,
  covering the atomic single-field directives. This generalizes the engine into
  **tokenization families**: a dialect's `syntax` is now a discriminated union over
  a `delimited` family (letter tokens with `[…]`/`'…'` literals — moment, ldml) and
  a new `directive` family (`%`-prefixed tokens, `%%` for a literal marker). The
  parser and renderer are generic over the family, so a new grammar is a new
  strategy, not an engine change. Also adds the `space-padded` canonical style
  (strftime `%e`/`%k`/`%l`) alongside `numeric` and `2-digit`.

  **Breaking:** `Dialect.literal: LiteralRules` is now `Dialect.syntax: TokenSyntax`.
  A delimited dialect that was `{ literal: { open, close, escapedDelimiter? } }`
  becomes `{ syntax: { kind: 'delimited', open, close, escapedDelimiter? } }`. The
  `LiteralRules` type is replaced by `TokenSyntax` / `DelimitedSyntax` /
  `DirectiveSyntax`.

- 504e7c1: Fill remaining `strftime` directive gaps. New atomic directives: `%C` (century,
  2-digit) — backed by the new `Canonical.CenturyTwoDigit` — and `%g` (ISO
  week-numbering year, 2-digit, mapping to the existing `WeekYearTwoDigitIso`,
  shared with `moment`'s `GG`). New composites `%n` and `%t` expand to a literal
  newline/tab, applying the parse-time macro mechanism to literal whitespace, so
  they normalize to that raw character on a round trip. `%C` has no clean target in
  the other built-in dialects, so it round-trips through `strftime` and falls to
  the unsupported-token policy elsewhere.
- 3c1389c: Recognize the glibc `strftime` padding flags `%-X` (unpadded) and `%0X` (explicit
  zero). Both map to canonicals the core directives already cover: `%-X` reaches the
  `numeric` style and `%0X` the default `2-digit`/`3-digit`. `%-X` notably fills the
  plain numeric forms the bare directives lacked — `%-d`/`%-m`/`%-H`/`%-I`/`%-M`/
  `%-S`/`%-j`/`%-V` — so a numeric `moment` `D` or `ldml` `d` now round-trips through
  `strftime` instead of falling to the unsupported-token policy. `%0X` is redundant
  with the bare directive, so it parses but normalizes to `%X` on render.

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
