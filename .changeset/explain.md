---
"rosetta-date": minor
---

Add `explain(format, { from, to })` — a read-only dry run of `convert`. It builds
on `describe` and reports, per field, whether the target can render it and as
which token (`status: 'converted'`, with `target`), or why it cannot
(`status: 'unsupported'`, with `reason`). Literals and unrecognized runs pass
through unchanged. Useful for migration audits — seeing what a conversion keeps,
remaps, or drops before running it.
