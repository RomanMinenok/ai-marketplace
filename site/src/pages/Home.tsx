import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSiteData } from '../lib/SiteDataContext'
import { ALL_KINDS, countBy, KIND_LABELS } from '../lib/search'
import { KindDot } from '../components/KindBadge'
import { t } from '../i18n/uk'

export default function Home() {
  const navigate = useNavigate()
  const { entries, changelog, loading } = useSiteData()
  const [query, setQuery] = useState('')

  const hasCatalog = entries.length > 0
  const stats = ALL_KINDS.map((k) => ({ kind: k, label: KIND_LABELS[k], count: countBy(entries, k) }))

  const heroChips = useMemo(() => {
    const kwCount = new Map<string, number>()
    entries.forEach((e) => e.keywords.forEach((k) => kwCount.set(k, (kwCount.get(k) || 0) + 1)))
    return [...kwCount.keys()].sort((a, b) => (kwCount.get(b) || 0) - (kwCount.get(a) || 0)).slice(0, 7)
  }, [entries])

  const whatsNewPreview = changelog.slice(0, 4)

  function goSearch(extra?: { kinds?: string[]; keyword?: string }) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (extra?.kinds) params.set('kind', extra.kinds.join(','))
    if (extra?.keyword) params.set('kw', extra.keyword)
    navigate(`/search?${params.toString()}`)
  }

  if (loading) return null

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 22px 80px' }}>
      <section style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 44px' }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: 'var(--accent)',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          {t.home.eyebrow}
        </div>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-.025em', fontWeight: 700, margin: '0 0 14px' }}>
          {t.home.titleLine1}
          <br />
          {t.home.titleLine2}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-dim)', margin: '0 auto 26px', maxWidth: 560 }}>
          {t.home.subtitle}
        </p>
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goSearch()}
            placeholder={t.home.searchPlaceholder}
            style={{
              width: '100%',
              height: 52,
              padding: '0 16px 0 44px',
              background: 'var(--bg-elev)',
              border: '1px solid var(--border-strong)',
              borderRadius: 12,
              color: 'var(--text)',
              outline: 'none',
              fontSize: 15,
              boxShadow: '0 4px 24px -12px rgba(0,0,0,.4)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {heroChips.map((c) => (
            <button
              key={c}
              onClick={() => goSearch({ keyword: c })}
              className="mono"
              style={{
                height: 28,
                padding: '0 12px',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              #{c}
            </button>
          ))}
        </div>
      </section>

      {!hasCatalog && (
        <section
          style={{
            textAlign: 'center',
            border: '1px dashed var(--border-strong)',
            borderRadius: 16,
            padding: '54px 24px',
            background: 'var(--bg-elev)',
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 10 }}>📦</div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>{t.home.emptyTitle}</h2>
          <p style={{ color: 'var(--text-dim)', margin: '0 auto 20px', maxWidth: 420 }}>
            {t.home.emptyDesc}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/getting-started')}
              style={{
                height: 38,
                padding: '0 18px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 9,
                color: 'var(--accent-fg)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.home.emptyCta}
            </button>
          </div>
        </section>
      )}

      {hasCatalog && (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 40 }}>
            {stats
              .filter((s) => s.kind !== 'plugin')
              .concat(stats.filter((s) => s.kind === 'plugin'))
              .slice(0, 5)
              .map((s) => (
                <button
                  key={s.kind}
                  onClick={() => goSearch({ kinds: [s.kind] })}
                  style={{
                    textAlign: 'left',
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '16px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <div className="mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>
                    {s.count}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{s.label}</div>
                </button>
              ))}
          </section>

          {whatsNewPreview.length > 0 && (
            <section style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t.home.whatsNewTitle}</h2>
                <a onClick={() => navigate('/whats-new')} style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-dim)' }}>
                  {t.home.whatsNewLink}
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {whatsNewPreview.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/plugin/${r.pluginName}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--border)',
                      borderRadius: 11,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 6,
                        color: 'var(--kind-plugin)',
                        background: 'color-mix(in oklab, var(--kind-plugin) 15%, transparent)',
                      }}
                    >
                      v{r.version}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{r.displayName}</div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-dim)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.summary}
                      </div>
                    </div>
                    {r.date && (
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0 }}>
                        {r.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>{t.home.browseByType}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {stats.map((s) => (
                <button
                  key={s.kind}
                  onClick={() => goSearch({ kinds: [s.kind] })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '12px 16px',
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--border)',
                    borderRadius: 11,
                    cursor: 'pointer',
                    color: 'var(--text)',
                  }}
                >
                  <KindDot kind={s.kind} />
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{s.label}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    {s.count}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
