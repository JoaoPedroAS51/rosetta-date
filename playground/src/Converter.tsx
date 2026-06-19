import type { PolicyChoice } from './converter-core'
import type { ConverterState } from './url-state'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { reasonText, roundTrip, runConvert, toSnippet } from './converter-core'
import { endpoints, getEndpoint } from './endpoints'
import { readState, writeState } from './url-state'

export interface Example {
  readonly label: string
  readonly from: string
  readonly to: string
  readonly format: string
}

export interface ConverterProps {
  readonly initialFrom?: string
  readonly initialTo?: string
  readonly initialFormat?: string
  readonly initialPolicy?: PolicyChoice
  /** Reflect state into the URL query string (shareable links). Off by default. */
  readonly syncUrl?: boolean
  /** Override the example chips. Pass `[]` to hide them. */
  readonly examples?: readonly Example[]
}

const DEFAULT_EXAMPLES: readonly Example[] = [
  { label: 'DD/MM/YYYY', from: 'momentjs', to: 'date-fns', format: 'DD/MM/YYYY' },
  { label: 'ISO', from: 'momentjs', to: 'date-fns', format: 'YYYY-MM-DD[T]HH:mm:ss' },
  { label: 'LLL (preset)', from: 'momentjs', to: 'date-fns', format: 'LLL' },
  { label: 'ISO week (ext)', from: 'momentjs', to: 'date-fns', format: '[week] WW, GGGG' },
  { label: 'X (epoch)', from: 'momentjs', to: 'date-fns', format: 'X' },
  { label: 'Mo (dayjs can\'t)', from: 'momentjs', to: 'dayjs', format: 'Mo' },
  { label: 'z (zone)', from: 'dayjs', to: 'momentjs', format: 'HH:mm z' },
]

const POLICY_LABELS: Record<PolicyChoice, string> = {
  literalize: 'literalize (default) — escape as a literal',
  throw: 'throw — UnsupportedTokenError',
  drop: 'drop — omit the token',
}

export function Converter({
  initialFrom = 'momentjs',
  initialTo = 'date-fns',
  initialFormat = 'ddd, Do MMM YYYY h:mm A',
  initialPolicy = 'literalize',
  syncUrl = false,
  examples = DEFAULT_EXAMPLES,
}: ConverterProps): React.JSX.Element {
  const defaults = useMemo<ConverterState>(
    () => ({ from: initialFrom, to: initialTo, format: initialFormat, policy: initialPolicy }),
    [initialFrom, initialTo, initialFormat, initialPolicy],
  )

  const [state, setState] = useState<ConverterState>(defaults)
  // Hold off writing the URL until the initial read has happened, otherwise the
  // first write (with default state) would clobber an incoming shared link.
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

  const outcome = useMemo(() => runConvert(from, to, state.format, state.policy), [from, to, state.format, state.policy])
  const rt = useMemo(() => roundTrip(from, to, state.format), [from, to, state.format])
  const snippet = useMemo(() => toSnippet(from, to, state.format, state.policy), [from, to, state.format, state.policy])

  const swap = useCallback(() => patch({ from: state.to, to: state.from }), [patch, state.from, state.to])

  return (
    <div className="rd-converter">
      <div className="rd-endpoints">
        <label className="rd-field">
          <span>From</span>
          <select value={state.from} onChange={event => patch({ from: event.target.value })}>
            {endpoints.map(endpoint => (
              <option key={endpoint.id} value={endpoint.id}>{`${endpoint.label} (${endpoint.kind})`}</option>
            ))}
          </select>
        </label>
        <button type="button" className="rd-swap" title="Swap from / to" onClick={swap}>⇄</button>
        <label className="rd-field">
          <span>To</span>
          <select value={state.to} onChange={event => patch({ to: event.target.value })}>
            {endpoints.map(endpoint => (
              <option key={endpoint.id} value={endpoint.id}>{`${endpoint.label} (${endpoint.kind})`}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="rd-field rd-block">
        <span>Format string</span>
        <input
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={state.format}
          onChange={event => patch({ format: event.target.value })}
        />
      </label>

      <div className="rd-field rd-block">
        <span className="rd-result-head">
          Result
          {rt && <span className={`rd-badge ${rt.ok ? 'is-ok' : 'is-warn'}`}>{rt.ok ? 'round-trips ✓' : 'lossy ⚠'}</span>}
        </span>
        <output className="rd-result" data-state={outcome.ok ? 'ok' : 'error'}>
          {outcome.ok ? (outcome.output || '(empty)') : `✖  ${outcome.errorMessage}`}
        </output>
      </div>

      {outcome.unsupported.length > 0 && (
        <div className="rd-unsupported">
          <span className="rd-unsupported-head">
            {outcome.unsupported.length}
            {' '}
            unsupported token
            {outcome.unsupported.length > 1 ? 's' : ''}
          </span>
          <ul>
            {outcome.unsupported.map((hit, index) => (
              <li key={`${hit.token}-${index}`}>
                <code>{hit.token}</code>
                <span className="rd-reason">
                  <strong>{hit.reason}</strong>
                  {' '}
                  —
                  {' '}
                  {reasonText[hit.reason]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="rd-field rd-block">
        <span>On unsupported token</span>
        <select value={state.policy} onChange={event => patch({ policy: event.target.value as PolicyChoice })}>
          {(Object.keys(POLICY_LABELS) as PolicyChoice[]).map(policy => (
            <option key={policy} value={policy}>{POLICY_LABELS[policy]}</option>
          ))}
        </select>
      </label>

      {examples.length > 0 && (
        <div className="rd-chips">
          <span>try:</span>
          {examples.map(example => (
            <button
              key={example.label}
              type="button"
              onClick={() => patch({ from: example.from, to: example.to, format: example.format })}
            >
              {example.label}
            </button>
          ))}
        </div>
      )}

      <Snippet code={snippet} />
    </div>
  )
}

function Snippet({ code }: { code: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(setCopied, 1500, false)
    })
  }, [code])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <details className="rd-snippet">
      <summary>
        Copy as code
        <button type="button" onClick={copy}>{copied ? 'copied ✓' : 'copy'}</button>
      </summary>
      <pre><code>{code}</code></pre>
    </details>
  )
}
