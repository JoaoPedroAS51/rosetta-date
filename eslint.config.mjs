import antfu from '@antfu/eslint-config'
import markdownPreferences from 'eslint-plugin-markdown-preferences'

export default antfu({
  type: 'lib',
  typescript: true,
  ignores: ['dist', 'coverage', 'playground', 'CHANGELOG.md', 'docs/.next', 'docs/out', 'docs/next-env.d.ts'],
})
  .append(markdownPreferences.configs.standard)
  .append({
    files: ['**/*.md'],
    rules: {
      'markdown-preferences/emphasis-delimiters-style': ['error', { emphasis: '*', strong: '**' }],
    },
  })
  .append({
    files: ['docs/**'],
    rules: {
      'ts/explicit-function-return-type': 'off',
      'ts/explicit-module-boundary-types': 'off',
    },
  })
