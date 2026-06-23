import type { Endpoint } from './endpoints'
import { useMemo } from 'react'
import { toIntl } from './converter-core'

interface Props {
  readonly from: Endpoint
  readonly format: string
}

export function IntlView({ from, format }: Props): React.JSX.Element {
  const outcome = useMemo(() => toIntl(from, format), [from, format])
  const entries = Object.entries(outcome.options)

  if (!outcome.ok)
    return <div className="rd-hero is-error">{outcome.errorMessage}</div>

  return (
    <>
      <div className="rd-olabel-row">
        <span className="rd-olabel">Intl.DateTimeFormatOptions</span>
        <span className="rd-badge is-neutral">{`${entries.length} ${entries.length === 1 ? 'field' : 'fields'}`}</span>
      </div>

      {entries.length === 0
        ? <div className="rd-empty">No Intl-expressible fields — order and literals are dropped by design.</div>
        : (
            <div className="rd-intl">
              {entries.map(([key, value]) => (
                <div key={key}>
                  <span className="rd-intl-key">{key}</span>
                  <span className="rd-intl-punct">: </span>
                  <span className="rd-intl-val">{`'${String(value)}'`}</span>
                  <span className="rd-intl-punct">,</span>
                </div>
              ))}
            </div>
          )}

      {outcome.sample && (
        <div className="rd-sample">
          <span className="rd-olabel">Live sample</span>
          <div className="rd-sample-val">{outcome.sample}</div>
          <span className="rd-hint">new Intl.DateTimeFormat(undefined, options).format(date)</span>
        </div>
      )}
    </>
  )
}
