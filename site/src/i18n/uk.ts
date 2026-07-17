// All user-facing UI copy lives here, in one place, instead of scattered
// literals inside components. Swap this file for another locale later
// without touching a single component.

export const t = {
  common: {
    copyInstall: 'Copy install',
    copied: 'Скопійовано ✓',
    copiedToast: 'Скопійовано в буфер',
    open: 'Відкрити',
    back: '← Назад',
    backHome: '← На головну',
    viewOnGithub: 'View on GitHub ↗',
    github: 'GitHub ↗',
    catalog: 'Каталог',
    pluginWord: 'плагін',
    updatedOn: (date: string) => `оновлено ${date}`,
  },
  header: {
    searchPlaceholder: 'Пошук по каталогу…',
  },
  home: {
    eyebrow: 'Marketplace плагінів · скілів · агентів',
    titleLine1: 'Знайди потрібний артефакт',
    titleLine2: 'і постав його одним copy-paste',
    subtitle:
      'Клієнтський fuzzy-пошук по описах, frontmatter і тілу markdown. Без бекенду — уся статика зібрана в CI.',
    searchPlaceholder: 'Опиши, що треба — напр. "скіл для рефакторингу React"',
    emptyTitle: 'Каталог порожній',
    emptyDesc:
      "Ще немає жодного плагіна. Додай перший — і він одразу з'явиться тут після білду індексу в CI.",
    emptyCta: 'Як почати',
    whatsNewTitle: 'Що нового',
    whatsNewLink: 'Уся стрічка →',
    browseByType: 'Переглянути за типом',
  },
  search: {
    filters: 'Фільтри',
    reset: 'Скинути',
    type: 'Тип',
    keywords: 'Keywords',
    author: 'Автор',
    sortLabel: 'Сортувати',
    sortRelevance: 'За релевантністю',
    sortName: 'За назвою',
    sortUpdated: 'Нещодавно оновлені',
    overview: 'Огляд каталогу',
    resultsFor: (q: string) => `Результати: "${q}"`,
    countArtifacts: (n: number) => `${n} ${n === 1 ? 'артефакт' : 'артефактів'}`,
    searchPlaceholder: 'Пошук…',
    noResultsTitle: 'Нічого не знайшли',
    noResultsDesc: 'Спробуйте скинути фільтри або змінити запит.',
    resetFilters: 'Скинути фільтри',
  },
  pluginDetail: {
    composition: 'Склад плагіна',
    dependencies: 'Залежності',
    readme: 'README',
    changelog: 'Changelog',
    notFound: 'Плагін не знайдено.',
  },
  artifactDetail: {
    toolsPermissions: 'Tools / permissions',
    documentation: 'Документація',
    notFound: 'Артефакт не знайдено.',
  },
  whatsNew: {
    title: 'Що нового',
    empty: 'Поки що немає жодного релізу.',
  },
  gettingStarted: {
    title: 'Як підключити marketplace',
    subtitle: 'Три кроки. Спершу додай marketplace як джерело, потім став окремі плагіни.',
    step1Title: 'Додати marketplace як джерело',
    step1Desc: 'Реєструє репозиторій каталогу у твоєму Claude Code.',
    step2Title: 'Встановити потрібний плагін',
    step2Desc: 'Постав конкретний плагін за іменем із цього marketplace.',
    step3Title: 'Оновлювати',
    step3Desc: 'Періодично оновлюй список джерел і самі плагіни.',
    noteStrong: 'marketplace update vs plugin update.',
    noteRest:
      'Перше оновлює список джерел (звідки брати плагіни), друге — код конкретного встановленого плагіна.',
  },
  commandPalette: {
    placeholder: 'Перейти до артефакту…',
    empty: 'Нічого не знайдено',
  },
  kinds: {
    plugin: 'плагіни',
    skill: 'скіли',
    agent: 'агенти',
    command: 'команди',
    hook: 'hooks',
    mcp: 'MCP',
  },
} as const
