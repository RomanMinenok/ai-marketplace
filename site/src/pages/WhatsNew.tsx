import { useNavigate } from 'react-router-dom'
import { useSiteData } from '../lib/SiteDataContext'
import { t } from '../i18n/uk'

export default function WhatsNew() {
  const navigate = useNavigate()
  const { changelog, loading } = useSiteData()

  if (loading) return null

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '26px 22px 80px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 18 }}
      >
        {t.common.backHome}
      </button>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 22px', letterSpacing: '-.02em' }}>{t.whatsNew.title}</h1>

      {changelog.length === 0 ? (
        <p style={{ color: 'var(--text-dim)' }}>{t.whatsNew.empty}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {changelog.map((r, i) => (
            <div
              key={i}
              onClick={() => navigate(`/plugin/${r.pluginName}`)}
              style={{
                display: 'flex',
                gap: 16,
                padding: '16px 18px',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              <div style={{ flexShrink: 0, textAlign: 'right', width: 90 }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--kind-plugin)' }}>
                  v{r.version}
                </div>
                {r.date && (
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {r.date}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.displayName}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{r.summary}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
