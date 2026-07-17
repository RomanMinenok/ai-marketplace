import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSiteData } from '../lib/SiteDataContext'
import { KindDot } from './KindBadge'
import { t } from '../i18n/uk'

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen, entries, index } = useSiteData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const list = query.trim() ? index.search(query).map((r) => r.item) : entries
    return list.slice(0, 8)
  }, [query, index, entries])

  if (!paletteOpen) return null

  function open(route: string) {
    setPaletteOpen(false)
    setQuery('')
    navigate(route)
  }

  return (
    <div
      onClick={() => setPaletteOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fade .12s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          maxWidth: '92vw',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border-strong)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)',
          animation: 'pop .14s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-faint)' }}>⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.commandPalette.placeholder}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 15 }}
          />
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-faint)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 5 }}
          >
            ESC
          </span>
        </div>
        <div style={{ maxHeight: '52vh', overflow: 'auto', padding: 6 }}>
          {results.map((e) => (
            <button
              key={e.id}
              onClick={() => open(e.route)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '9px 12px',
                background: 'none',
                border: 'none',
                borderRadius: 9,
                cursor: 'pointer',
                color: 'var(--text)',
                textAlign: 'left',
              }}
            >
              <KindDot kind={e.kind} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 500 }}>{e.displayName}</span>{' '}
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  · {e.kind === 'plugin' ? t.common.pluginWord : e.pluginName}
                </span>
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'capitalize' }}>
                {e.kind}
              </span>
            </button>
          ))}
          {results.length === 0 && (
            <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>{t.commandPalette.empty}</div>
          )}
        </div>
      </div>
    </div>
  )
}
