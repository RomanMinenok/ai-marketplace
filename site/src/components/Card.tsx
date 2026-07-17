import { useNavigate } from 'react-router-dom'
import type { SearchEntry } from '../types'
import KindBadge from './KindBadge'
import CopyInstallButton from './CopyInstallButton'
import { useSiteData, installText } from '../lib/SiteDataContext'
import { t } from '../i18n/en'

export default function Card({ entry }: { entry: SearchEntry }) {
  const navigate = useNavigate()
  const { meta } = useSiteData()
  const meta_label = entry.kind === 'plugin' ? entry.author.name : `${entry.pluginName} · ${entry.author.name}`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 13,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '15px 16px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 9,
          }}
        >
          <KindBadge kind={entry.kind} />
          {entry.version && (
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              v{entry.version}
            </span>
          )}
        </div>
        <div
          onClick={() => navigate(entry.route)}
          style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
        >
          {entry.displayName}
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-dim)',
            margin: '5px 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 38,
          }}
        >
          {entry.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 11 }}>
          {entry.keywords.slice(0, 3).map((kw) => (
            <span key={kw} className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              #{kw}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          background: 'color-mix(in oklab, var(--bg-elev2) 60%, var(--bg))',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-faint)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {meta_label}
        </span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <CopyInstallButton text={installText(entry.pluginName, meta.marketplaceName)} id={'c:' + entry.id} />
          <button
            onClick={() => navigate(entry.route)}
            style={{
              height: 28,
              padding: '0 12px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 7,
              color: 'var(--accent-fg)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {t.common.open}
          </button>
        </div>
      </div>
    </div>
  )
}
