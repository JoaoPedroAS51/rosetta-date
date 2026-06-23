import type { PolicyChoice } from './converter-core'
import type { ConverterState, Mode } from './url-state'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConvertView } from './ConvertView'
import { endpoints, getEndpoint } from './endpoints'
import { InspectView } from './InspectView'
import { IntlView } from './IntlView'
import { readState, writeState } from './url-state'

export interface Example {
  readonly label: string
  readonly from: string
  readonly to: string
  readonly format: string
  readonly mode?: Mode
}

export interface ConverterProps {
  readonly initialMode?: Mode
  readonly initialFrom?: string
  readonly initialTo?: string
  readonly initialFormat?: string
  readonly initialPolicy?: PolicyChoice
  /** Reflect state into the URL query string (shareable links). Off by default. */
  readonly syncUrl?: boolean
  /** Override the example chips. Pass `[]` to hide them. */
  readonly examples?: readonly Example[]
}

const MODES: readonly { id: Mode, label: string }[] = [
  { id: 'convert', label: 'Convert' },
  { id: 'inspect', label: 'Inspect' },
  { id: 'intl', label: 'Intl' },
]

const POLICY_LABELS: Record<PolicyChoice, string> = {
  literalize: 'literalize — escape as a literal',
  throw: 'throw — UnsupportedTokenError',
  drop: 'drop — omit the token',
}

const DEFAULT_EXAMPLES: readonly Example[] = [
  { label: 'DD/MM/YYYY', from: 'momentjs', to: 'date-fns', format: 'DD/MM/YYYY' },
  { label: 'ISO', from: 'momentjs', to: 'date-fns', format: 'YYYY-MM-DD[T]HH:mm:ss' },
  { label: 'strftime', from: 'strftime', to: 'ldml', format: '%A, %d %b %Y %I:%M %p' },
  { label: 'day-of-year', from: 'momentjs', to: 'dayjs', format: 'dddd Do [of] MMMM, DDD', mode: 'inspect' },
  { label: 'Intl options', from: 'momentjs', to: 'date-fns', format: 'YYYY-MM-DD HH:mm', mode: 'intl' },
]

const ENDPOINT_GROUPS: readonly { kind: 'dialect' | 'library', label: string }[] = [
  { kind: 'dialect', label: 'Dialects' },
  { kind: 'library', label: 'Libraries' },
]

function EndpointSelect({ label, value, onChange }: { label: string, value: string, onChange: (id: string) => void }): React.JSX.Element {
  return (
    <label>
      <span className="rd-flabel">{label}</span>
      <div className="rd-select">
        <select value={value} onChange={event => onChange(event.target.value)}>
          {ENDPOINT_GROUPS.map(group => (
            <optgroup key={group.kind} label={group.label}>
              {endpoints.filter(endpoint => endpoint.kind === group.kind).map(endpoint => (
                <option key={endpoint.id} value={endpoint.id}>{endpoint.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </label>
  )
}

export function Converter({
  initialMode = 'convert',
  initialFrom = 'momentjs',
  initialTo = 'date-fns',
  initialFormat = 'ddd, Do MMM YYYY h:mm A',
  initialPolicy = 'literalize',
  syncUrl = false,
  examples = DEFAULT_EXAMPLES,
}: ConverterProps): React.JSX.Element {
  const defaults = useMemo<ConverterState>(
    () => ({ mode: initialMode, from: initialFrom, to: initialTo, format: initialFormat, policy: initialPolicy }),
    [initialMode, initialFrom, initialTo, initialFormat, initialPolicy],
  )

  const [state, setState] = useState<ConverterState>(defaults)
  const [ready, setReady] = useState(!syncUrl)

  useEffect(() => {
    if (syncUrl) {
      setState(readState(defaults))
      setReady(true)
    }
  }, [syncUrl, defaults])

  useEffect(() => {
    if (syncUrl && ready)
      writeState(state, defaults)
  }, [syncUrl, ready, state, defaults])

  const patch = useCallback((next: Partial<ConverterState>) => setState(prev => ({ ...prev, ...next })), [])

  const from = getEndpoint(state.from) ?? getEndpoint(initialFrom)!
  const to = getEndpoint(state.to) ?? getEndpoint(initialTo)!
  const swap = useCallback(() => patch({ from: state.to, to: state.from }), [patch, state.from, state.to])

  return (
    <div className="rd">
      <div className="rd-tabbar" role="tablist">
        {MODES.map(mode => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={state.mode === mode.id}
            className="rd-tab"
            onClick={() => patch({ mode: mode.id })}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="rd-main">
        <div className="rd-left">
          <EndpointSelect label={state.mode === 'intl' ? 'Read from' : 'From'} value={state.from} onChange={id => patch({ from: id })} />
          {state.mode !== 'intl' && (
            <>
              <div className="rd-swap-wrap">
                <button type="button" className="rd-swap" aria-label="Swap from and to" onClick={swap}>⇄</button>
              </div>
              <EndpointSelect label="To" value={state.to} onChange={id => patch({ to: id })} />
            </>
          )}
          <div className="rd-gap" />
          <label>
            <span className="rd-flabel">Format</span>
            <input
              className="rd-input"
              type="text"
              spellCheck={false}
              autoComplete="off"
              value={state.format}
              onChange={event => patch({ format: event.target.value })}
            />
          </label>
          {state.mode === 'convert' && (
            <>
              <div className="rd-gap" />
              <label>
                <span className="rd-flabel">On unsupported</span>
                <div className="rd-select">
                  <select value={state.policy} onChange={event => patch({ policy: event.target.value as PolicyChoice })}>
                    {(Object.keys(POLICY_LABELS) as PolicyChoice[]).map(value => (
                      <option key={value} value={value}>{POLICY_LABELS[value]}</option>
                    ))}
                  </select>
                </div>
              </label>
            </>
          )}
        </div>

        <div className="rd-right">
          {state.mode === 'convert' && <ConvertView from={from} to={to} format={state.format} policy={state.policy} />}
          {state.mode === 'inspect' && <InspectView from={from} to={to} format={state.format} />}
          {state.mode === 'intl' && <IntlView from={from} format={state.format} />}
        </div>
      </div>

      {examples.length > 0 && (
        <div className="rd-examples">
          <span>try</span>
          {examples.map(example => (
            <button
              key={example.label}
              type="button"
              className="rd-example"
              onClick={() => patch({ from: example.from, to: example.to, format: example.format, ...(example.mode ? { mode: example.mode } : {}) })}
            >
              {example.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
