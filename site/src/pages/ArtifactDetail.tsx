import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useSiteData, installText } from '../lib/SiteDataContext'
import KindBadge from '../components/KindBadge'
import CopyInstallButton from '../components/CopyInstallButton'
import { t } from '../i18n/en'

export default function ArtifactDetail() {
  const { kind, plugin: pluginName, name } = useParams()
  const navigate = useNavigate()
  const { entries, plugins, meta, loading } = useSiteData()

  if (loading) return null

  const entry = entries.find((e) => e.kind === kind && e.pluginName === pluginName && e.name === name)
  const parent = pluginName ? plugins[pluginName] : undefined

  if (!entry) {
    return (
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '26px 22px 80px' }}>
        <p style={{ color: 'var(--text-dim)' }}>{t.artifactDetail.notFound}</p>
      </main>
    )
  }

  const install = installText(entry.pluginName, meta.marketplaceName)

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '26px 22px 80px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 18 }}>
        <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          {t.common.catalog}
        </a>
        <span style={{ color: 'var(--text-faint)' }}> / </span>
        <a onClick={() => navigate(`/plugin/${entry.pluginName}`)} style={{ cursor: 'pointer' }}>
          {parent ? parent.displayName : entry.pluginName}
        </a>
        <span style={{ color: 'var(--text-faint)' }}> / {entry.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <KindBadge kind={entry.kind} />
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-.02em' }}>{entry.displayName}</h1>
        {entry.invocation && (
          <span
            className="mono"
            style={{
              fontSize: 13,
              color: 'var(--accent)',
              background: 'color-mix(in oklab, var(--accent) 12%, transparent)',
              padding: '3px 9px',
              borderRadius: 6,
            }}
          >
            {entry.invocation}
          </span>
        )}
      </div>
      <p style={{ color: 'var(--text-dim)', margin: '8px 0 0', maxWidth: 600 }}>{entry.description}</p>

      {entry.tools.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              marginBottom: 8,
            }}
          >
            {t.artifactDetail.toolsPermissions}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {entry.tools.map((tool) => (
              <span
                key={tool}
                className="mono"
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 7,
                  background: 'var(--bg-elev)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-dim)',
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

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
        <CopyInstallButton text={install} id={'a:' + entry.id} variant="wide" />
      </div>

      {entry.content && (
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{t.artifactDetail.documentation}</h2>
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
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </div>
        </section>
      )}
    </main>
  )
}
