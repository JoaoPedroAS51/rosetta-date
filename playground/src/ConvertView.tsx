import type { PolicyChoice } from './converter-core'
import type { Endpoint } from './endpoints'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { explainConversion, roundTrip, runConvert, toSnippet } from './converter-core'

interface Props {
  readonly from: Endpoint
  readonly to: Endpoint
  readonly format: string
  readonly policy: PolicyChoice
}

export function ConvertView({ from, to, format, policy }: Props): React.JSX.Element {
  const outcome = useMemo(() => runConvert(from, to, format, policy), [from, to, format, policy])
  const rt = useMemo(() => roundTrip(from, to, format), [from, to, format])
  const segments = useMemo(() => explainConversion(from, to, format), [from, to, format])
  const snippet = useMemo(() => toSnippet(from, to, format, policy), [from, to, format, policy])

  const fields = segments.flatMap(segment => segment.kind === 'field' ? [segment] : [])

  return (
    <>
      <div className="rd-olabel-row">
        <span className="rd-olabel">Result</span>
        {rt && <span className={`rd-badge ${rt.ok ? 'is-ok' : 'is-warn'}`}>{rt.ok ? 'round-trips' : 'lossy'}</span>}
      </div>

      {outcome.ok
        ? (
            <div className="rd-hero">
              {segments.length === 0
                ? (outcome.output || '(empty)')
                : segments.map((segment, index) => {
                    if (segment.kind === 'literal')
                      return <span key={index} className="rd-l">{segment.value}</span>
                    if (segment.kind === 'unknown')
                      return <span key={index} className="rd-x">{segment.value}</span>
                    if (segment.status === 'converted')
                      return <span key={index} className="rd-t">{segment.target}</span>
                    if (policy === 'drop')
                      return null
                    return <span key={index} className="rd-x">{segment.token}</span>
                  })}
            </div>
          )
        : <div className="rd-hero is-error">{outcome.errorMessage}</div>}

      {fields.length > 0 && (
        <div className="rd-map">
          {fields.map((field, index) => (
            <span key={index}>
              {field.token}
              <b>→</b>
              {field.status === 'converted' ? field.target : '✕'}
              {index < fields.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="rd-foot">
        <div className="rd-foot-head">
          <span className="rd-olabel">Code</span>
          <Copy code={snippet} />
        </div>
        <pre className="rd-code"><code>{highlightTs(snippet)}</code></pre>
      </div>
    </>
  )
}

// Lightweight TS highlighter for the generated snippet, coloured to match
// Nextra's github-light/github-dark Shiki theme.
const TOKEN_RE = /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*')|\b(?:import|from|const|return|new)\b(?!\s*:)|([a-z_$][\w$]*)(?=\s*\()/gi

function highlightTs(code: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let last = 0
  for (const match of code.matchAll(TOKEN_RE)) {
    const start = match.index
    if (start > last)
      nodes.push(code.slice(last, start))
    const [text, comment, str, fn] = match
    let cls = 'rd-cw'
    if (comment)
      cls = 'rd-cc'
    else if (str)
      cls = 'rd-cs'
    else if (fn)
      cls = 'rd-cf'
    nodes.push(<span key={start} className={cls}>{text}</span>)
    last = start + text.length
  }
  if (last < code.length)
    nodes.push(code.slice(last))
  return nodes
}

function Copy({ code }: { code: string }): React.JSX.Element {
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
    <button type="button" className="rd-copy" onClick={copy}>
      {copied ? 'copied ✓' : 'copy'}
    </button>
  )
}
