import type { Kind } from '../types'
import { KIND_LABELS } from '../lib/search'

export default function KindBadge({ kind }: { kind: Kind }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 6,
        textTransform: 'capitalize',
        color: `var(--kind-${kind})`,
        background: `color-mix(in oklab, var(--kind-${kind}) 15%, transparent)`,
        whiteSpace: 'nowrap',
      }}
    >
      {kind}
    </span>
  )
}

export function KindDot({ kind }: { kind: Kind }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: `var(--kind-${kind})`,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

export function kindLabel(kind: Kind) {
  return KIND_LABELS[kind]
}
