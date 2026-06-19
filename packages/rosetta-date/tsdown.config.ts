import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/dialects/index.ts', 'src/libraries/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  target: 'es2022',
  // Mirror the source module structure instead of emitting one bundle, so a
  // consumer importing only `convert` can tree-shake unused dialect tables.
  unbundle: true,
})
