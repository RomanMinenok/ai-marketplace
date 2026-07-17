import { useSiteData } from '../lib/SiteDataContext'
import { t } from '../i18n/en'

interface Props {
  text: string
  id: string
  variant?: 'compact' | 'wide'
}

export default function CopyInstallButton({ text, id, variant = 'compact' }: Props) {
  const { copy, copiedId } = useSiteData()
  const copied = copiedId === id
  if (variant === 'wide') {
    return (
      <button
        onClick={() => copy(text, id)}
        style={{
          height: 44,
          padding: '0 18px',
          background: 'var(--accent)',
          border: 'none',
          borderRadius: 10,
          color: 'var(--accent-fg)',
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {copied ? t.common.copied : t.common.copyInstall}
      </button>
    )
  }
  return (
    <button
      onClick={() => copy(text, id)}
      style={{
        height: 28,
        padding: '0 10px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 7,
        color: copied ? 'var(--kind-skill)' : 'var(--text)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {copied ? t.common.copied : t.common.copyInstall}
    </button>
  )
}
