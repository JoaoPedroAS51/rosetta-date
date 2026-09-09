import antfu from '@antfu/eslint-config'
import markdownPreferences from 'eslint-plugin-markdown-preferences'

export default antfu({
  type: 'lib',
  typescript: true,
  ignores: [
    '**/dist',
    '**/coverage',
    '**/CHANGELOG.md',
    'docs/.next',
    'docs/out',
    'docs/next-env.d.ts',
    'docs/public/_pagefind',
  ],
})
  .append(markdownPreferences.configs.standard)
  .append({
    files: ['**/*.md'],
    rules: {
      'markdown-preferences/emphasis-delimiters-style': ['error', { emphasis: '*', strong: '**' }],
    },
  })
  .append({
    files: ['docs/**', 'playground/**'],
    rules: {
      'ts/explicit-function-return-type': 'off',
      'ts/explicit-module-boundary-types': 'off',
    },
  })
  // Disable enforcement because `trustPolicy: no-downgrade` rejects transitive
  // dependencies such as `semver@6.3.1` and breaks `pnpm install`.
  .append({
    files: ['pnpm-workspace.yaml'],
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
    },
  })
