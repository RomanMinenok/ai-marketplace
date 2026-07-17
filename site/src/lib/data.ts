import type { ChangelogEntry, PluginDetailData, SearchEntry, SiteMeta } from '../types'

// Data is served as static JSON under public/data/ (written by
// scripts/build-site-data.mjs) — fetched at runtime, not bundled, so a new
// catalog build never requires a JS rebuild.
const dataUrl = (file: string) => `${import.meta.env.BASE_URL}data/${file}`

async function fetchJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(dataUrl(file))
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

export interface LoadedSiteData {
  entries: SearchEntry[]
  plugins: Record<string, PluginDetailData>
  changelog: ChangelogEntry[]
  meta: SiteMeta
}

let cached: Promise<LoadedSiteData> | null = null

export function loadSiteData(): Promise<LoadedSiteData> {
  if (!cached) {
    cached = Promise.all([
      fetchJson<SearchEntry[]>('search-index.json', []),
      fetchJson<Record<string, PluginDetailData>>('plugins.json', {}),
      fetchJson<ChangelogEntry[]>('changelog-feed.json', []),
      fetchJson<SiteMeta>('meta.json', { marketplaceName: 'seasoned-ai-marketplace', repoUrl: null }),
    ]).then(([entries, plugins, changelog, meta]) => ({ entries, plugins, changelog, meta }))
  }
  return cached
}
