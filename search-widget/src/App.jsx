import { useEffect, useRef, useState } from 'react'
import { useAdvisingSearch } from './useAdvisingSearch'
import { useSourceStatus } from './useSourceStatus'
import './App.css'

const programs = [
  { value: null, label: 'All' },
  { value: 'MIM', label: 'MIM' },
  { value: 'HCIM', label: 'HCIM' },
]

function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    program: params.get('program') || null,
    track: params.get('track') || null,
    thesisTrack: params.get('thesisTrack') === 'true',
    studentName: params.get('studentName') || null,
  }
}

function formatIndexedDate(sources) {
  const timestamps = sources
    .map((source) => Date.parse(source.last_indexed_at))
    .filter(Number.isFinite)

  if (timestamps.length === 0) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(Math.max(...timestamps)))
}

function HighlightedSnippet({ text }) {
  if (!text) {
    return null
  }

  return (
    <p className="result-card__excerpt">
      {text.split(/(<<<.*?>>>)/g).map((part, index) => {
        if (part.startsWith('<<<') && part.endsWith('>>>')) {
          return <mark key={index}>{part.slice(3, -3)}</mark>
        }

        return part
      })}
    </p>
  )
}

function ResultCard({ result }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const program = result.metadata?.program
  const category = result.metadata?.category

  const sourceLabel = [program, category]
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(' ')

  const fallbackExcerpt =
    result.content?.length > 420
      ? `${result.content.slice(0, 420).trim()}…`
      : result.content

  const fullContent = result.content?.trim()
  const canExpand = fullContent && fullContent.length > 420
  const contentId = `section-${result.id}`

  async function handleCopyCitation() {
    const citation = [
      result.heading || 'Handbook section',
      sourceLabel || 'Graduate handbook',
      `Section ${result.id}`,
    ].join(' — ')

    try {
      await navigator.clipboard.writeText(citation)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="result-card">
      <div className="result-card__header">
        <div>
          <p className="result-card__eyebrow">{sourceLabel || 'Handbook'}</p>
          <h2>{result.heading || 'Handbook section'}</h2>
        </div>
        {program && <span className="program-badge">{program}</span>}
      </div>

      {expanded ? (
        <div className="result-card__full-content" id={contentId}>
          {fullContent}
        </div>
      ) : (
        <HighlightedSnippet text={result.snippet || fallbackExcerpt} />
      )}

      <footer className="result-card__footer">
        <span>Handbook reference</span>
        <span>Section #{result.id}</span>

        <div className="result-card__actions">
          {canExpand && (
            <button
              aria-controls={contentId}
              aria-expanded={expanded}
              className="expand-button"
              onClick={() => setExpanded((current) => !current)}
              type="button"
            >
              {expanded ? 'Show excerpt' : 'Read full section'}
            </button>
          )}

          <button
            className="copy-button"
            onClick={handleCopyCitation}
            type="button"
          >
            {copied ? 'Copied' : 'Copy citation'}
          </button>
        </div>
      </footer>
    </article>
  )
}

export default function App() {
  const urlParams = getUrlParams()
  const [query, setQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState(
    programs.find((p) => p.value === urlParams.program)?.value ?? null
  )
  const inputRef = useRef(null)
  const { results, loading, error, hasSearched, search } = useAdvisingSearch()
  const { sources } = useSourceStatus()

  const indexedDate = formatIndexedDate(sources)
  const programLabel =
    programs.find((program) => program.value === selectedProgram)?.label ?? 'All'

  const contextBanner = urlParams.studentName || urlParams.track || urlParams.thesisTrack
    ? [
        urlParams.studentName ? `Student: ${urlParams.studentName}` : null,
        urlParams.track ? `Track: ${urlParams.track}` : null,
        urlParams.thesisTrack ? 'Thesis track' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable

      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    search(query, selectedProgram)
  }

  function handleProgramChange(program) {
    setSelectedProgram(program)

    if (query.trim()) {
      search(query, program)
    }
  }

  function handleClearSearch() {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="product-name" href="/">
          Advising Search
        </a>
        {indexedDate && (
          <span className="topbar__status">Sources indexed {indexedDate}</span>
        )}
      </header>

      {contextBanner && (
        <div className="context-banner" aria-label="Planner context">
          {contextBanner}
        </div>
      )}

      <section className="search-panel" aria-labelledby="page-title">
        <div className="search-panel__copy">
          <p className="kicker">Graduate handbook search</p>
          <h1 id="page-title">Find advising information</h1>
          <p>
            Search program requirements, courses, policies, and academic
            planning guidance.
          </p>
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          "abel className="sr-only" htmlFor="advising-search">
            Search handbook information
          </label>

          <div className="search-input-wrap">
            <input
              id="advising-search"
              className="search-form__input"
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the handbook"
              type="search"
            />

            {query && (
              <button
                aria-label="Clear search"
                className="clear-search-button"
                onClick={handleClearSearch}
                type="button"
              >
                Clear
              </button>
            )}
          </div>

          <button
            className="search-form__button"
            disabled={loading || !query.trim()}
            type="submit"
          >
            {loading ? 'Searching' : 'Search'}
          </button>
        </form>

        <div className="filters" aria-label="Filter results by program">
          <span className="filters__label">Program</span>
          {programs.map((program) => (
            <button
              aria-pressed={selectedProgram === program.value}
              className={
                selectedProgram === program.value
                  ? 'filter-button filter-button--active'
                  : 'filter-button'
              }
              key={program.label}
              onClick={() => handleProgramChange(program.value)}
              type="button"
            >
              {program.label}
            </button>
          ))}
          <span className="keyboard-hint">
            Press <kbd>/</kbd> to search
          </span>
        </div>
      </section>

      <section className="results-area" aria-live="polite">
        {error && (
          <p className="message message--error" role="alert">
            Search could not be completed: {error}
          </p>
        )}

        {loading && <p className="message">Searching handbook sections…</p>}

        {hasSearched && !loading && !error && results.length === 0 && (
          <div className="empty-state">
            <h2>No results found</h2>
            <p>
              No {selectedProgram ?? 'program'} handbook sections matched{' '}
              "{query.trim()}". Try a broader or different term.
            </p>
          </div>
        )}

        {!hasSearched && (
          <div className="empty-state">
            <h2>Search handbook guidance</h2>
            <p>
              Start with a topic such as "capstone," "electives," "tracks," or
              "registration."
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="results-meta">
              <span>
                {results.length} result{results.length === 1 ? '' : 's'}
              </span>
              <span>{programLabel} programs</span>
            </div>

            <div className="results-list">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="app-footer">
        Handbook search is a reference tool. Confirm individual academic plans
        with your graduate advisor.
      </footer>
    </main>
  )
}
