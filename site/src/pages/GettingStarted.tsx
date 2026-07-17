import { useNavigate } from 'react-router-dom'
import { useSiteData } from '../lib/SiteDataContext'
import CopyInstallButton from '../components/CopyInstallButton'
import { t } from '../i18n/uk'

export default function GettingStarted() {
  const navigate = useNavigate()
  const { meta, entries } = useSiteData()

  const firstPlugin = entries.find((e) => e.kind === 'plugin')?.pluginName || 'my-plugin'

  const steps = [
    {
      title: t.gettingStarted.step1Title,
      desc: t.gettingStarted.step1Desc,
      cmd: `/plugin marketplace add ${meta.repoUrl ? meta.repoUrl.replace('https://github.com/', '') : meta.marketplaceName}`,
    },
    {
      title: t.gettingStarted.step2Title,
      desc: t.gettingStarted.step2Desc,
      cmd: `/plugin install ${firstPlugin}@${meta.marketplaceName}`,
    },
    {
      title: t.gettingStarted.step3Title,
      desc: t.gettingStarted.step3Desc,
      cmd: '/plugin marketplace update',
    },
  ]

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '26px 22px 80px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 18 }}
      >
        {t.common.backHome}
      </button>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-.02em' }}>{t.gettingStarted.title}</h1>
      <p style={{ color: 'var(--text-dim)', margin: '0 0 32px', maxWidth: 560 }}>
        {t.gettingStarted.subtitle}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((st, i) => (
          <div key={i} style={{ display: 'flex', gap: 16 }}>
            <div
              className="mono"
              style={{
                flexShrink: 0,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'color-mix(in oklab, var(--accent) 16%, var(--bg-elev))',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 4px' }}>{st.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 10px' }}>{st.desc}</p>
              <div
                className="mono"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#000',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '11px 14px',
                  fontSize: 13,
                  color: '#cfe',
                }}
              >
                <span style={{ color: 'var(--text-faint)' }}>$</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.cmd}</span>
                <CopyInstallButton text={st.cmd} id={'s:' + i} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 30,
          padding: '16px 18px',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          fontSize: 13,
          color: 'var(--text-dim)',
        }}
      >
        <strong style={{ color: 'var(--text)' }}>{t.gettingStarted.noteStrong}</strong> {t.gettingStarted.noteRest}
      </div>
    </main>
  )
}
