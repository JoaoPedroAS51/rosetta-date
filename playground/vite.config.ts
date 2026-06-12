import { defineConfig } from 'vite'

// Root is this `playground/` dir; allow importing the live `../src` so edits to
// the library show up on reload without a build step.
export default defineConfig({
  server: { fs: { allow: ['..'] } },
})
