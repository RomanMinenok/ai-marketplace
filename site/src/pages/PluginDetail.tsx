import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useSiteData, installText } from '../lib/SiteDataContext'
import { kindLabel } from '../components/KindBadge'
import CopyInstallButton from '../components/CopyInstallButton'
import { ALL_KINDS } from '../lib/search'
import type { Kind } from '../types'
import { t } from '../i18n/uk'

export default function PluginDetail() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { plugins, meta, loading } = useSiteData()

  if (loading) return null
  const plugin = name ? plugins[name] : undefined

  if (!plugin) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '26px 22px 80px' }}>
        <p style={{ color: 'var(--text-dim)' }}>{t.pluginDetail.notFound}</p>
      </main>
    )
  }

  const install = installText(plugin.name, meta.marketplaceName)
  const comps = ALL_KINDS.filter((k) => k !== 'plugin').map((k) => ({
    kind: k as Kind,
    items: plugin.artifactsByKind[k as Kind] || [],
  })).filter((g) => g.items.length > 0)

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '26px 22px 80px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 20 }}
      >
        {t.common.back}
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 13,
            background: 'color-mix(in oklab, var(--kind-plugin) 16%, var(--bg-elev))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          ◆
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-.02em' }}>{plugin.displayName}</h1>
            {plugin.version && (
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
                v{plugin.version}
              </span>
            )}
            {plugin.compatibility && (
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 6,
                  color: 'var(--kind-skill)',
                  background: 'color-mix(in oklab, var(--kind-skill) 14%, transparent)',
                }}
              >
                ✓ {plugin.compatibility}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-dim)', margin: '8px 0 0', maxWidth: 600 }}>{plugin.description}</p>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
            {plugin.author.name}
            {plugin.updated ? ` · ${t.common.updatedOn(plugin.updated)}` : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, margin: '22px 0 30px' }}>
        <div
          className="mono"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#000',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '0 14px',
            fontSize: 13,
            color: '#cfe',
          }}
        >
          <span style={{ color: 'var(--text-faint)' }}>$</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{install}</span>
        </div>
        <CopyInstallButton text={install} id={'p:' + plugin.name} variant="wide" />
        {plugin.githubUrl && (
          <a
            href={plugin.githubUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              height: 44,
              padding: '0 16px',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text)',
              fontWeight: 500,
            }}
          >
            {t.common.viewOnGithub}
          </a>
        )}
      </div>

      {comps.length > 0 && (
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{t.pluginDetail.composition}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comps.map((g) => (
              <div key={g.kind}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--kind-${g.kind})` }} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {kindLabel(g.kind)}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {g.items.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 8 }}>
                  {g.items.map((it) => (
                    <button
                      key={it.name}
                      onClick={() => navigate(`/artifact/${g.kind}/${plugin.name}/${it.name}`)}
                      style={{
                        textAlign: 'left',
                        background: 'var(--bg-elev)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '11px 13px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{it.displayName}</span>
                        {it.invocation && (
                          <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>
                            {it.invocation}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-dim)',
                          marginTop: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {it.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {plugin.dependencies.length > 0 && (
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{t.pluginDetail.dependencies}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {plugin.dependencies.map((d) => {
              const pluginName = d.split(':')[0]
              const target = plugins[pluginName]
              return (
                <button
                  key={d}
                  onClick={() => target && navigate(`/plugin/${pluginName}`)}
                  className="mono"
                  disabled={!target}
                  style={{
                    fontSize: 12,
                    padding: '6px 12px',
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    cursor: target ? 'pointer' : 'default',
                  }}
                >
                  {d} {target ? '↗' : ''}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {plugin.readme && (
        <section style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{t.pluginDetail.readme}</h2>
          <div
            style={{
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 13,
              padding: '22px 24px',
              color: 'var(--text-dim)',
              lineHeight: 1.65,
            }}
          >
            <ReactMarkdown>{plugin.readme}</ReactMarkdown>
          </div>
        </section>
      )}

      {plugin.changelog.length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{t.pluginDetail.changelog}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {plugin.changelog.map((c, i) => (
              <div key={i} style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--kind-plugin)' }}>
                    v{c.version}
                  </span>
                  {c.date && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{c.date}</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 5 }}>{c.summary}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
