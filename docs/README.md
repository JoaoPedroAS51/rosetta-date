# rosetta-date docs

Documentation site for [rosetta-date](https://github.com/JoaoPedroAS51/rosetta-date), built with
[Nextra 4](https://nextra.site) (App Router).

This is a **standalone** package — it has its own `package.json` and lockfile and is intentionally
isolated from the library at the repository root, so installing or building the docs never touches
the library's dependency tree.

## Develop

```bash
cd docs
pnpm install
pnpm dev      # http://localhost:3000
```

## Build

```bash
pnpm build    # static export-ready production build
pnpm start    # serve the production build
```

## Where content lives

Pages are MDX files under `content/`, with one `_meta.js` per directory controlling the sidebar
order and titles. Add a page by dropping a new `.mdx` file in the relevant folder and listing it in
that folder's `_meta.js`.

## Notes

- `pnpm-workspace.yaml` pins `zod` to `4.1.12` (the version Nextra 4.6 was built against; `4.4.x`
  rejects an optional `children` prop the theme relies on) and approves `sharp`'s native build.
