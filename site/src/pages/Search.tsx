import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSiteData } from '../lib/SiteDataContext'
import { ALL_KINDS, countBy, filterAndSort, KIND_LABELS, type SortMode } from '../lib/search'
import type { Kind } from '../types'
import Card from '../components/Card'
import { KindDot } from '../components/KindBadge'
import { t } from '../i18n/en'

export default function Search() {
  const { entries, index } = useSiteData()
  const [params, setParams] = useSearchParams()

  const query = params.get('q') || ''
  const kindParam = params.get('kind')
  const kwParam = params.get('kw')
  const authorParam = params.get('author')

  const [sort, setSort] = useState<SortMode>('relevance')

  const facetKinds = useMemo<Kind[]>(() => (kindParam ? (kindParam.split(',') as Kind[]) : []), [kindParam])
  const facetKeywords = useMemo(() => (kwParam ? kwParam.split(',') : []), [kwParam])

  function setQuery(q: string) {
    const next = new URLSearchParams(params)
    if (q) next.set('q', q)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  function toggleKind(k: Kind) {
    const next = new URLSearchParams(params)
    const set = new Set(facetKinds)
    if (set.has(k)) set.delete(k)
    else set.add(k)
    if (set.size) next.set('kind', [...set].join(','))
    else next.delete('kind')
    setParams(next, { replace: true })
  }

  function toggleKeyword(k: string) {
    const next = new URLSearchParams(params)
    const set = new Set(facetKeywords)
    if (set.has(k)) set.delete(k)
    else set.add(k)
    if (set.size) next.set('kw', [...set].join(','))
    else next.delete('kw')
    setParams(next, { replace: true })
  }

  function setAuthor(a: string | null) {
    const next = new URLSearchParams(params)
    if (a) next.set('author', a)
    else next.delete('author')
    setParams(next, { replace: true })
  }

  function clearFacets() {
    setParams(new URLSearchParams(), { replace: true })
  }

  const results = filterAndSort(entries, index, query, { kinds: facetKinds, keywords: facetKeywords, author: authorParam }, sort)

  const kwCount = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach((e) => e.keywords.forEach((k) => map.set(k, (map.get(k) || 0) + 1)))
    return map
  }, [entries])

  const authors = useMemo(() => [...new Set(entries.map((e) => e.author.name))], [entries])

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '26px 22px 80px',
        display: 'grid',
        gridTemplateColumns: '230px 1fr',
        gap: 28,
      }}
    >
      <aside style={{ alignSelf: 'start', position: 'sticky', top: 82 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              color: 'var(--text-faint)',
            }}
          >
            {t.search.filters}
          </span>
          <button onClick={clearFacets} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {t.search.reset}
          </button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '0 0 8px' }}>{t.search.type}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
          {ALL_KINDS.map((k) => {
            const on = facetKinds.includes(k)
            return (
              <button
                key={k}
                onClick={() => toggleKind(k)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '6px 8px',
                  borderRadius: 7,
                  background: on ? 'color-mix(in oklab, var(--accent) 14%, transparent)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  textAlign: 'left',
                }}
              >
                <KindDot kind={k} />
                <span style={{ flex: 1, textTransform: 'capitalize', fontSize: 13 }}>{KIND_LABELS[k]}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  {countBy(entries, k)}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '0 0 8px' }}>{t.search.keywords}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {[...kwCount.keys()].sort().map((k) => {
            const on = facetKeywords.includes(k)
            return (
              <button
                key={k}
                onClick={() => toggleKeyword(k)}
                className="mono"
                style={{
                  padding: '3px 9px',
                  borderRadius: 20,
                  fontSize: 11,
                  cursor: 'pointer',
                  background: on ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'var(--bg-elev)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  color: on ? 'var(--accent)' : 'var(--text-dim)',
                }}
              >
                {k}
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '0 0 8px' }}>{t.search.author}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {authors.map((a) => {
            const on = authorParam === a
            return (
              <button
                key={a}
                onClick={() => setAuthor(on ? null : a)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 7,
                  background: on ? 'color-mix(in oklab, var(--accent) 14%, transparent)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  textAlign: 'left',
                  fontSize: 13,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>
                  {entries.filter((e) => e.author.name === a).length}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 3px' }}>
              {query ? t.search.resultsFor(query) : t.search.overview}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              {t.search.countArtifacts(results.length)}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
            {t.search.sortLabel}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              style={{
                height: 32,
                padding: '0 8px',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="relevance">{t.search.sortRelevance}</option>
              <option value="name">{t.search.sortName}</option>
              <option value="updated">{t.search.sortUpdated}</option>
            </select>
          </label>
        </div>

        {query !== undefined && (
          <div style={{ marginBottom: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search.searchPlaceholder}
              style={{
                width: '100%',
                maxWidth: 420,
                height: 36,
                padding: '0 12px',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                color: 'var(--text)',
                outline: 'none',
                fontSize: 13,
              }}
            />
          </div>
        )}

        {results.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {results.map((e) => (
              <Card key={e.id} entry={e} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed var(--border-strong)', borderRadius: 14 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
            <h3 style={{ margin: '0 0 6px' }}>{t.search.noResultsTitle}</h3>
            <p style={{ color: 'var(--text-dim)', margin: '0 0 16px' }}>{t.search.noResultsDesc}</p>
            <button
              onClick={clearFacets}
              style={{
                height: 34,
                padding: '0 16px',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {t.search.resetFilters}
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
