// All user-facing UI copy lives here, in one place, instead of scattered
// literals inside components. Swap this file for another locale later
// without touching a single component.

export const t = {
  common: {
    copyInstall: 'Copy install',
    copied: 'Copied ✓',
    copiedToast: 'Copied to clipboard',
    open: 'Open',
    back: '← Back',
    backHome: '← Home',
    viewOnGithub: 'View on GitHub ↗',
    github: 'GitHub ↗',
    catalog: 'Catalog',
    pluginWord: 'plugin',
    updatedOn: (date: string) => `updated ${date}`,
  },
  header: {
    searchPlaceholder: 'Search the catalog…',
  },
  home: {
    eyebrow: 'Marketplace of plugins · skills · agents',
    titleLine1: 'Find the artifact you need',
    titleLine2: 'and install it with one copy-paste',
    subtitle:
      'Client-side fuzzy search across descriptions, frontmatter, and markdown body. No backend — everything static, built in CI.',
    searchPlaceholder: 'Describe what you need — e.g. "a skill for refactoring React"',
    emptyTitle: 'Catalog is empty',
    emptyDesc:
      "No plugins yet. Add the first one and it will show up here right after the CI index build.",
    emptyCta: 'How to get started',
    whatsNewTitle: "What's new",
    whatsNewLink: 'View full feed →',
    browseByType: 'Browse by type',
  },
  search: {
    filters: 'Filters',
    reset: 'Reset',
    type: 'Type',
    keywords: 'Keywords',
    author: 'Author',
    sortLabel: 'Sort',
    sortRelevance: 'By relevance',
    sortName: 'By name',
    sortUpdated: 'Recently updated',
    overview: 'Catalog overview',
    resultsFor: (q: string) => `Results for: "${q}"`,
    countArtifacts: (n: number) => `${n} ${n === 1 ? 'artifact' : 'artifacts'}`,
    searchPlaceholder: 'Search…',
    noResultsTitle: 'Nothing found',
    noResultsDesc: 'Try resetting the filters or changing your query.',
    resetFilters: 'Reset filters',
  },
  pluginDetail: {
    composition: 'Plugin composition',
    dependencies: 'Dependencies',
    readme: 'README',
    changelog: 'Changelog',
    notFound: 'Plugin not found.',
  },
  artifactDetail: {
    toolsPermissions: 'Tools / permissions',
    documentation: 'Documentation',
    notFound: 'Artifact not found.',
  },
  whatsNew: {
    title: "What's new",
    empty: 'No releases yet.',
  },
  gettingStarted: {
    title: 'How to connect the marketplace',
    subtitle: 'Three steps. First add the marketplace as a source, then install individual plugins.',
    step1Title: 'Add the marketplace as a source',
    step1Desc: 'Registers this catalog repository in your Claude Code.',
    step2Title: 'Install the plugin you need',
    step2Desc: 'Install a specific plugin by name from this marketplace.',
    step3Title: 'Keep it updated',
    step3Desc: 'Periodically update the list of sources and the plugins themselves.',
    noteStrong: 'marketplace update vs plugin update.',
    noteRest:
      'The former updates the list of sources (where plugins come from), the latter updates the code of an installed plugin.',
  },
  commandPalette: {
    placeholder: 'Jump to an artifact…',
    empty: 'Nothing found',
  },
  kinds: {
    plugin: 'plugins',
    skill: 'skills',
    agent: 'agents',
    command: 'commands',
    hook: 'hooks',
    mcp: 'MCP',
  },
} as const
