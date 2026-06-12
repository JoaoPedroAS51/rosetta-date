import type { Assume, ConvertOptions, Dialect, Library } from '../src'
import { convert, Unsupported, UnsupportedTokenError } from '../src'
import { ldml, moment } from '../src/dialects'
import { dateFns, dayjs, momentjs } from '../src/libraries'

const endpoints = {
  'moment (dialect)': moment,
  'ldml (dialect)': ldml,
  'momentjs (library)': momentjs,
  'dayjs (library)': dayjs,
  'date-fns (library)': dateFns,
}

type EndpointName = keyof typeof endpoints

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T
const fromSel = el<HTMLSelectElement>('from')
const toSel = el<HTMLSelectElement>('to')
const formatInput = el<HTMLInputElement>('format')
const policySel = el<HTMLSelectElement>('policy')
const result = el<HTMLOutputElement>('result')
const assumeBox = el<HTMLFieldSetElement>('assume-box')
const assumeOn = el<HTMLInputElement>('assume-on')
const assumeGrid = el<HTMLDivElement>('assume-grid')

for (const name of Object.keys(endpoints) as EndpointName[]) {
  fromSel.add(new Option(name, name))
  toSel.add(new Option(name, name))
}
fromSel.value = 'momentjs (library)'
toSel.value = 'date-fns (library)'

const KINDS = ['plugins', 'flags', 'env'] as const
type Kind = typeof KINDS[number]

const isLibrary = (endpoint: Dialect | Library): endpoint is Library => 'dialect' in endpoint

/** The plugin/flag/env names a library declares across its capability map. */
function declaredCapabilities(endpoint: Dialect | Library): Record<Kind, string[]> {
  const found: Record<Kind, Set<string>> = { plugins: new Set(), flags: new Set(), env: new Set() }
  if (isLibrary(endpoint)) {
    for (const capability of endpoint.capabilities?.values() ?? []) {
      if (capability === 'supported') continue
      if ('plugin' in capability) found.plugins.add(capability.plugin)
      else if ('flag' in capability) found.flags.add(capability.flag)
      else found.env.add(capability.env)
    }
  }
  return { plugins: [...found.plugins], flags: [...found.flags], env: [...found.env] }
}

/** One labelled checkbox group: every option the target declares for this kind, pre-checked. */
function renderKind(kind: Kind, options: string[]): HTMLDivElement {
  const row = document.createElement('div')
  row.className = 'cap'

  const name = document.createElement('span')
  name.className = 'cap-kind'
  name.textContent = kind
  row.append(name)

  if (options.length === 0) {
    const empty = document.createElement('span')
    empty.className = 'cap-empty'
    empty.textContent = '—'
    row.append(empty)
    return row
  }

  const opts = document.createElement('div')
  opts.className = 'cap-opts'
  for (const option of options) {
    const label = document.createElement('label')
    label.className = 'cap-opt'
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = true
    box.dataset.kind = kind
    box.value = option
    label.append(box, option)
    opts.append(label)
  }
  row.append(opts)
  return row
}

/** Rebuild the assume checkboxes from the current target's declared capabilities. */
function syncAssume(): void {
  const declared = declaredCapabilities(endpoints[toSel.value as EndpointName])
  assumeGrid.replaceChildren(...KINDS.map(kind => renderKind(kind, declared[kind])))
}

/** The checked capabilities, bucketed by kind — what `assume` declares the target has. */
function readAssume(): Assume {
  const pick = (kind: Kind): string[] =>
    [...assumeGrid.querySelectorAll<HTMLInputElement>(`input[data-kind="${kind}"]:checked`)].map(box => box.value)
  return { plugins: pick('plugins'), flags: pick('flags'), env: pick('env') }
}

function policy(): ConvertOptions['onUnsupportedToken'] {
  switch (policySel.value) {
    case 'throw': return 'throw'
    case 'drop': return () => Unsupported.drop
    default: return 'literalize'
  }
}

function run(): void {
  const from = endpoints[fromSel.value as EndpointName]
  const to = endpoints[toSel.value as EndpointName]
  const assume = assumeOn.checked ? readAssume() : undefined
  try {
    result.textContent = convert(formatInput.value, { from, to, onUnsupportedToken: policy(), assume }) || '(empty)'
    result.dataset.state = 'ok'
  }
  catch (error) {
    result.textContent = error instanceof UnsupportedTokenError ? `✖  ${error.message}` : `✖  ${String(error)}`
    result.dataset.state = 'error'
  }
}

assumeOn.addEventListener('change', () => {
  assumeBox.disabled = !assumeOn.checked
  run()
})

assumeGrid.addEventListener('change', run)

toSel.addEventListener('input', () => {
  syncAssume()
  run()
})

for (const node of [formatInput, fromSel, policySel])
  node.addEventListener('input', run)

el<HTMLButtonElement>('swap').addEventListener('click', () => {
  const previous = fromSel.value
  fromSel.value = toSel.value
  toSel.value = previous
  syncAssume()
  run()
})

for (const chip of document.querySelectorAll<HTMLButtonElement>('.chips button')) {
  chip.addEventListener('click', () => {
    if (chip.dataset.from) fromSel.value = chip.dataset.from
    if (chip.dataset.to) toSel.value = chip.dataset.to
    formatInput.value = chip.dataset.fmt ?? ''
    syncAssume()
    run()
  })
}

syncAssume()
run()
