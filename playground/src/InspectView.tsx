import type { ExplainedReason } from 'rosetta-date'
import type { Endpoint } from './endpoints'
import { useMemo } from 'react'
import { explainConversion } from './converter-core'

interface Props {
  readonly from: Endpoint
  readonly to: Endpoint
  readonly format: string
}

function reasonLabel(reason: ExplainedReason, to: Endpoint): string {
  return reason === 'unsupported-by-target' ? `${to.label} can’t render` : `no ${to.label} token`
}

export function InspectView({ from, to, format }: Props): React.JSX.Element {
  const segments = useMemo(() => explainConversion(from, to, format), [from, to, format])

  if (segments.length === 0)
    return <div className="rd-empty">Nothing to inspect yet.</div>

  return (
    <>
      <div className="rd-olabel-row">
        <span className="rd-olabel">Tokens</span>
        <span className="rd-badge is-neutral">{`${from.label} → ${to.label}`}</span>
      </div>
      <div className="rd-insp">
        {segments.map((segment, index) => {
          if (segment.kind === 'literal') {
            return (
              <div key={index} className="rd-irow">
                <span className="rd-lit-tag">literal</span>
                <span className="rd-canon">{`“${segment.value}”`}</span>
                <span />
              </div>
            )
          }

          if (segment.kind === 'unknown') {
            return (
              <div key={index} className="rd-irow">
                <span className="rd-tok is-bad">{segment.value}</span>
                <span className="rd-canon">unrecognized</span>
                <span className="rd-reason">{`not in ${from.label}`}</span>
              </div>
            )
          }

          return (
            <div key={index} className="rd-irow">
              <span className={`rd-tok ${segment.status === 'unsupported' ? 'is-bad' : ''}`}>{segment.token}</span>
              <span className="rd-canon">{segment.canonical}</span>
              {segment.status === 'converted'
                ? <span className="rd-target">{segment.target}</span>
                : <span className="rd-reason">{reasonLabel(segment.reason, to)}</span>}
            </div>
          )
        })}
      </div>
    </>
  )
}
