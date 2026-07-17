import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Fuse from 'fuse.js'
import type { ChangelogEntry, PluginDetailData, SearchEntry, SiteMeta } from '../types'
import { loadSiteData } from './data'
import { buildIndex } from './search'
import { t } from '../i18n/uk'

interface SiteDataValue {
  loading: boolean
  entries: SearchEntry[]
  plugins: Record<string, PluginDetailData>
  changelog: ChangelogEntry[]
  meta: SiteMeta
  index: Fuse<SearchEntry>
  toast: string | null
  showToast: (message: string) => void
  copiedId: string | null
  copy: (text: string, id: string) => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
}

const Ctx = createContext<SiteDataValue | null>(null)

const EMPTY_META: SiteMeta = { marketplaceName: 'seasoned-ai-marketplace', repoUrl: null }

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<SearchEntry[]>([])
  const [plugins, setPlugins] = useState<Record<string, PluginDetailData>>({})
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [meta, setMeta] = useState<SiteMeta>(EMPTY_META)
  const [toast, setToast] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadSiteData().then((data) => {
      if (cancelled) return
      setEntries(data.entries)
      setPlugins(data.plugins)
      setChangelog(data.changelog)
      setMeta(data.meta)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && k === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const index = useMemo(() => buildIndex(entries), [entries])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 1800)
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* no-op: clipboard unavailable */
      }
      document.body.removeChild(ta)
    }
    setCopiedId(id)
    showToast(t.common.copiedToast)
    window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000)
  }

  const value: SiteDataValue = {
    loading,
    entries,
    plugins,
    changelog,
    meta,
    index,
    toast,
    showToast,
    copiedId,
    copy,
    paletteOpen,
    setPaletteOpen,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSiteData() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSiteData must be used within SiteDataProvider')
  return ctx
}

export function installText(pluginName: string, marketplaceName: string) {
  return `/plugin install ${pluginName}@${marketplaceName}`
}
