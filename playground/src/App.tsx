import { Converter } from './Converter'
import './converter.css'

export function App(): React.JSX.Element {
  return (
    <main className="page">
      <header className="page-head">
        <h1>
          rosetta-date
          {' '}
          <small>playground</small>
        </h1>
        <p>Convert a date-format token string between dialects and libraries.</p>
      </header>

      <Converter syncUrl />

      <footer className="page-foot">
        Pick a
        {' '}
        <code>dialect</code>
        {' '}
        for the pure spec, a
        {' '}
        <code>library</code>
        {' '}
        for the tool (its extensions plus the subset of tokens it renders).
        Links are shareable — the URL tracks your selection.
      </footer>
    </main>
  )
}
