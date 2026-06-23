import type { PolicyChoice } from './converter-core'

export type Mode = 'convert' | 'inspect' | 'intl'

export interface ConverterState {
  mode: Mode
  from: string
  to: string
  format: string
  policy: PolicyChoice
}

const MODES: readonly Mode[] = ['convert', 'inspect', 'intl']
const POLICIES: readonly PolicyChoice[] = ['literalize', 'throw', 'drop']

function isMode(value: string | null): value is Mode {
  return value != null && (MODES as readonly string[]).includes(value)
}

function isPolicy(value: string | null): value is PolicyChoice {
  return value != null && (POLICIES as readonly string[]).includes(value)
}

/** Read converter state from the current URL, falling back to `defaults`. */
export function readState(defaults: ConverterState): ConverterState {
  if (typeof window === 'undefined')
    return defaults
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')
  const policy = params.get('policy')
  return {
    mode: isMode(mode) ? mode : defaults.mode,
    from: params.get('from') ?? defaults.from,
    to: params.get('to') ?? defaults.to,
    format: params.get('fmt') ?? defaults.format,
    policy: isPolicy(policy) ? policy : defaults.policy,
  }
}

/** Reflect converter state into the URL without adding a history entry. */
export function writeState(state: ConverterState, defaults: ConverterState): void {
  if (typeof window === 'undefined')
    return
  const params = new URLSearchParams(window.location.search)
  const set = (key: string, value: string, fallback: string): void => {
    if (value === fallback)
      params.delete(key)
    else params.set(key, value)
  }
  set('mode', state.mode, defaults.mode)
  set('from', state.from, defaults.from)
  set('to', state.to, defaults.to)
  set('fmt', state.format, defaults.format)
  set('policy', state.policy, defaults.policy)
  const query = params.toString()
  const url = query ? `${window.location.pathname}?${query}` : window.location.pathname
  window.history.replaceState(null, '', url)
}
