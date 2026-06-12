import type { ConvertOptions } from '../src'
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

for (const name of Object.keys(endpoints) as EndpointName[]) {
  fromSel.add(new Option(name, name))
  toSel.add(new Option(name, name))
}
fromSel.value = 'momentjs (library)'
toSel.value = 'date-fns (library)'

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
  try {
    result.textContent = convert(formatInput.value, { from, to, onUnsupportedToken: policy() }) || '(empty)'
    result.dataset.state = 'ok'
  }
  catch (error) {
    result.textContent = error instanceof UnsupportedTokenError ? `✖  ${error.message}` : `✖  ${String(error)}`
    result.dataset.state = 'error'
  }
}

for (const node of [formatInput, fromSel, toSel, policySel])
  node.addEventListener('input', run)

el<HTMLButtonElement>('swap').addEventListener('click', () => {
  const previous = fromSel.value
  fromSel.value = toSel.value
  toSel.value = previous
  run()
})

for (const chip of document.querySelectorAll<HTMLButtonElement>('.chips button')) {
  chip.addEventListener('click', () => {
    if (chip.dataset.from) fromSel.value = chip.dataset.from
    if (chip.dataset.to) toSel.value = chip.dataset.to
    formatInput.value = chip.dataset.fmt ?? ''
    run()
  })
}

run()
