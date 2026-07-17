export type Kind = 'plugin' | 'skill' | 'agent' | 'command' | 'hook' | 'mcp'

export interface Author {
  name: string
  email: string | null
  url: string | null
}

export interface SearchEntry {
  id: string
  kind: Kind
  pluginName: string
  name: string
  displayName: string
  description: string
  category: string | null
  keywords: string[]
  tags: string[]
  author: Author
  version: string | null
  updated: string | null
  compatibility: string | null
  license: string | null
  homepage: string | null
  repository: string | null
  source: string | null
  invocation: string
  tools: string[]
  content: string
  route: string
}

export interface ChangelogEntry {
  pluginName: string
  displayName: string
  version: string
  date: string | null
  summary: string
}

export interface PluginArtifactSummary {
  kind: Kind
  name: string
  displayName: string
  description: string
  invocation: string
}

export interface PluginDetailData {
  name: string
  displayName: string
  description: string
  version: string | null
  compatibility: string | null
  author: Author
  updated: string | null
  license: string | null
  homepage: string | null
  repository: string | null
  githubUrl: string | null
  installText: string
  readme: string
  dependencies: string[]
  artifactsByKind: Partial<Record<Kind, PluginArtifactSummary[]>>
  changelog: ChangelogEntry[]
}

export interface SiteMeta {
  marketplaceName: string
  repoUrl: string | null
}
