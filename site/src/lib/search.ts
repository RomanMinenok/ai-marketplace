import Fuse from 'fuse.js'
import type { Kind, SearchEntry } from '../types'
import { t } from '../i18n/uk'

const FUSE_OPTIONS: ConstructorParameters<typeof Fuse<SearchEntry>>[1] = {
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
  keys: [
    { name: 'displayName', weight: 5 },
    { name: 'name', weight: 4 },
    { name: 'keywords', weight: 3 },
    { name: 'description', weight: 2 },
    { name: 'content', weight: 1 },
  ],
}

export function buildIndex(entries: SearchEntry[]) {
  return new Fuse(entries, FUSE_OPTIONS)
}

export type SortMode = 'relevance' | 'name' | 'updated'

export interface Facets {
  kinds: Kind[]
  keywords: string[]
  author: string | null
}

export const emptyFacets: Facets = { kinds: [], keywords: [], author: null }

export function filterAndSort(
  entries: SearchEntry[],
  index: Fuse<SearchEntry>,
  query: string,
  facets: Facets,
  sort: SortMode,
): SearchEntry[] {
  let list: SearchEntry[]
  if (query.trim()) {
    list = index.search(query).map((r) => r.item)
  } else {
    list = entries.slice()
  }

  if (facets.kinds.length) {
    list = list.filter((e) => facets.kinds.includes(e.kind))
  }
  if (facets.keywords.length) {
    list = list.filter((e) => facets.keywords.some((k) => e.keywords.includes(k)))
  }
  if (facets.author) {
    list = list.filter((e) => e.author.name === facets.author)
  }

  if (sort === 'name') {
    list = [...list].sort((a, b) => a.displayName.localeCompare(b.displayName))
  } else if (sort === 'updated') {
    list = [...list].sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
  }
  // 'relevance' keeps Fuse's own ordering (or catalog order with no query)

  return list
}

export function countBy(entries: SearchEntry[], kind: Kind): number {
  return entries.filter((e) => e.kind === kind).length
}

export const KIND_LABELS: Record<Kind, string> = t.kinds

export const ALL_KINDS: Kind[] = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp']
