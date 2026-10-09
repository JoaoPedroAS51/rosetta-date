import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

function src(path: string): string {
  return fileURLToPath(new URL(`./src/${path}`, import.meta.url))
}

export default defineConfig({
  resolve: {
    alias: [
      { find: /^rosetta-date$/, replacement: src('index.ts') },
      { find: /^rosetta-date\/(dialects|libraries|intl)$/, replacement: src('$1/index.ts') },
    ],
  },
  test: {
    expect: { requireAssertions: true },
    // Keep long `$case` values in parameterized test names.
    taskTitleValueFormatTruncate: 200,
    projects: [
      { test: { name: 'unit', include: ['test/unit/**/*.test.ts'] } },
      { test: { name: 'endpoints', include: ['test/endpoints/**/*.test.ts'] } },
      {
        test: {
          name: 'types',
          include: ['test/types/**/*.test-d.ts'],
          // `expectTypeOf` does not count as a runtime assertion.
          expect: { requireAssertions: false },
          typecheck: {
            enabled: true,
            include: ['test/types/**/*.test-d.ts'],
            // `tsc --noEmit` already checks `src`.
            ignoreSourceErrors: true,
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
