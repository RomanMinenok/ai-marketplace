import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSiteData } from '../lib/SiteDataContext'
import { getStoredTheme, storeTheme, type Theme } from '../lib/theme'
import CommandPalette from './CommandPalette'
import { t } from '../i18n/en'

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { meta, toast, setPaletteOpen } = useSiteData()
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    storeTheme(theme)
  }, [theme])

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          height: 58,
          padding: '0 22px',
          background: 'color-mix(in oklab, var(--bg-elev) 88%, transparent)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-fg)',
              fontWeight: 700,
              fontSize: 14,
            }}
            className="mono"
          >
            ◆
          </div>
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{t.common.catalog}</span>
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--text-faint)',
              border: '1px solid var(--border)',
              padding: '1px 6px',
              borderRadius: 5,
            }}
          >
            {meta.marketplaceName}
          </span>
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 520 }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              fontSize: 13,
            }}
          >
            ⌕
          </span>
          <input
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value
                navigate(`/search?q=${encodeURIComponent(v)}`)
              }
            }}
            placeholder={t.header.searchPlaceholder}
            style={{
              width: '100%',
              height: 36,
              padding: '0 12px 0 32px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              color: 'var(--text)',
              outline: 'none',
              fontSize: 13,
            }}
          />
        </div>
        <button
          onClick={() => setPaletteOpen(true)}
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 10px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ⌘K
        </button>
        <button
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          style={{
            width: 34,
            height: 34,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {theme === 'dark' ? '☾' : '☀'}
        </button>
        {meta.repoUrl && (
          <a href={meta.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-dim)', fontSize: 12, padding: '0 4px' }}>
            {t.common.github}
          </a>
        )}
      </header>

      {children}

      <CommandPalette />

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-elev2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            boxShadow: '0 12px 30px -10px rgba(0,0,0,.6)',
            animation: 'pop .16s ease',
          }}
        >
          <span style={{ color: 'var(--kind-skill)' }}>✓</span> {toast}
        </div>
      )}
    </div>
  )
}
