import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { close, createIndex } from 'pagefind'

const routeCacheDir = path.join('.next', 'server', 'route-cache', 'APP_PAGE')
const roots = [
  path.join('.next', 'server', 'app'),
  ...(existsSync(routeCacheDir)
    ? readdirSync(routeCacheDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(routeCacheDir, entry.name, '$'))
    : []),
].filter(root => existsSync(root))

try {
  const { index, errors } = await createIndex()
  if (errors.length || !index)
    throw new Error(errors.join('\n') || 'Pagefind could not create an index')

  const results = []
  for (const root of roots) {
    const result = await index.addDirectory({ path: root })
    if (result.errors.length)
      throw new Error(result.errors.join('\n'))
    results.push({ root, pageCount: result.page_count })
  }

  if (!results.some(result => result.pageCount > 0))
    throw new Error('Pagefind found no prerendered HTML')

  const written = await index.writeFiles({ outputPath: path.join('public', '_pagefind') })
  if (written.errors.length)
    throw new Error(written.errors.join('\n'))

  const summary = results.filter(result => result.pageCount > 0)
    .map(result => `${result.pageCount} from ${result.root}`)
    .join(', ')
  console.log(`Pagefind indexed ${summary} into ${written.outputPath}`)
}
finally {
  await close()
}
