import antfu from '@antfu/eslint-config'
import markdownPreferences from 'eslint-plugin-markdown-preferences'

export default antfu({
  type: 'lib',
  typescript: true,
  ignores: ['dist', 'coverage', 'playground', 'CHANGELOG.md'],
})
  .append(markdownPreferences.configs.standard)
  .append({
    files: ['**/*.md'],
    rules: {
      'markdown-preferences/emphasis-delimiters-style': ['error', { emphasis: '*', strong: '**' }],
    },
  })
