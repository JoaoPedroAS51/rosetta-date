# rosetta-date docs

Documentation site for [rosetta-date](https://github.com/JoaoPedroAS51/rosetta-date), built with
[Nextra 4](https://nextra.site) (App Router).

This is an app in the workspace. It consumes the library via `rosetta-date` (`workspace:*`), so its
examples exercise the real package.

## Develop

From the repository root:

```bash
pnpm install
pnpm docs:dev      # builds the library, then http://localhost:3000
```

## Build

```bash
pnpm docs:build    # from the root: builds the library, then the production site
```

## Where content lives

Pages are MDX files under `content/`, with one `_meta.js` per directory controlling the sidebar
order and titles. Add a page by dropping a new `.mdx` file in the relevant folder and listing it in
that folder's `_meta.js`.

## Notes

- The root `pnpm-workspace.yaml` pins `zod` to `4.1.12` (the version Nextra 4.6 was built against;
  `4.4.x` rejects an optional `children` prop the theme relies on) and approves `sharp`'s native
  build.
