# Marketplace Research

> Дослідження: як правильно створити та вести репозиторій-маркетплейс плагінів Claude Code.
> Зібрано з офіційної документації Claude Code, реального репозиторію `anthropics/claude-plugins-official`
> та практик спільноти. Дата: 2026-07-17.
>
> **Призначення файлу:** довідник рішень і пасток. Після того, як репозиторій буде наповнено,
> пройтися цим документом ще раз і звірити, що нічого не пропущено (див. §12 «Чек-ліст перевірки»).

## Зміст

1. [Джерела](#1-джерела)
2. [Модель: що таке маркетплейс і як він працює](#2-модель-що-таке-маркетплейс-і-як-він-працює)
3. [Структура репозиторію](#3-структура-репозиторію)
4. [Схема `marketplace.json`](#4-схема-marketplacejson)
5. [Джерела плагінів (`source`)](#5-джерела-плагінів-source)
6. [Схема `plugin.json`](#6-схема-pluginjson)
7. [Версіонування — головна пастка](#7-версіонування--головна-пастка)
8. [Кешування та резолвінг шляхів](#8-кешування-та-резолвінг-шляхів)
9. [Перейменування та видалення плагінів](#9-перейменування-та-видалення-плагінів)
10. [Валідація і CI](#10-валідація-і-ci)
11. [Безпека та командна дистрибуція](#11-безпека-та-командна-дистрибуція)
12. [Чек-ліст перевірки](#12-чек-ліст-перевірки)
13. [Кандидати на плагіни з `dev-digest`](#13-кандидати-на-плагіни-з-dev-digest)
14. [Відкриті питання](#14-відкриті-питання)

---

## 1. Джерела

| Джерело | Що дало |
| --- | --- |
| [Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) | Основний гайд: структура, схема `marketplace.json`, типи джерел, хостинг, версіонування, troubleshooting |
| [Plugins reference](https://code.claude.com/docs/en/plugins-reference) | Повна схема `plugin.json`, компоненти плагіна, шляхи, `${CLAUDE_PLUGIN_ROOT}` |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Реальний приклад: структура репо, пінування на `ref`+`sha`, `renames`, 9 CI-workflow-ів |
| [Your Claude Plugin Marketplace Needs More Than a Git Repo](https://www.mpt.solutions/your-claude-plugin-marketplace-needs-more-than-a-git-repo/) | Практики: чому голого git-репо мало, рев'ю як захист, пінування на SHA |
| [Build Your Own Claude Code Marketplace](https://dev.to/nagell/build-your-own-claude-code-marketplace-scaffold-structure-and-auto-updates-4n3f) | Скафолдинг, автооновлення |
| [Claude Code Plugins: From Personal Setup to Org Standard](https://claudefa.st/blog/tools/mcp-extensions/plugins-distribution) | Перехід від особистого набору до організаційного стандарту |

## 2. Модель: що таке маркетплейс і як він працює

Маркетплейс — це **git-репозиторій із файлом-каталогом** `.claude-plugin/marketplace.json`. Він не хостить
код плагінів обов'язково — він лише **каталог**, який каже, де їх шукати. Плагіни можуть лежати
в тому ж репо (відносні шляхи) або в будь-яких інших репозиторіях/npm.

Життєвий цикл:

1. Ви пушите зміни в репозиторій маркетплейсу.
2. Користувач додає маркетплейс: `/plugin marketplace add RomanMinenok/ai-marketplace`.
3. Користувач ставить плагін: `/plugin install <plugin>@<marketplace-name>`.
4. Оновлення каталогу: `/plugin marketplace update`; оновлення плагінів — `/plugin update` або автооновлення.

Claude Code копіює плагін у локальний кеш `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.

**Ключова архітектурна ідея:** *marketplace source* і *plugin source* — різні речі.
Перше — де взяти сам `marketplace.json` (задається користувачем при `add`, підтримує `ref`, але не `sha`).
Друге — де взяти конкретний плагін (задається в полі `source` запису, підтримує і `ref`, і `sha`).
Тобто один каталог може посилатися на десяток різних репо, кожен запінений незалежно.

## 3. Структура репозиторію

Мінімум — це `.claude-plugin/marketplace.json` у корені. Реальний офіційний репозиторій Anthropic
(`anthropics/claude-plugins-official`) виглядає так:

```
.claude-plugin/
  marketplace.json
.github/
  workflows/           # 9 workflow-ів (див. §10)
.gitignore
LICENSE
README.md
external_plugins/      # плагіни від зовнішніх авторів
plugins/               # власні плагіни
```

Структура окремого плагіна всередині `plugins/`:

```
plugins/my-plugin/
  .claude-plugin/
    plugin.json        # маніфест; опційний, але потрібен для метаданих
  skills/
    <skill-name>/
      SKILL.md         # обов'язковий файл скіла
      reference.md     # опційно
      scripts/         # опційно
  agents/
    reviewer.md
  commands/
    thing.md           # «плоскі» .md-команди
  hooks/
    hooks.json
```

**Правила розташування:**

- `marketplace.json` — **тільки** в `.claude-plugin/` у корені репо.
- Відносні шляхи в `source` резолвляться від **кореня маркетплейсу** (теки, що містить `.claude-plugin/`),
  а не від самої `.claude-plugin/`. Тобто `"./plugins/my-plugin"` → `<repo>/plugins/my-plugin`.
- `..` у `source` заборонено — валідатор відхилить (`Path contains ".."`).

## 4. Схема `marketplace.json`

### Обов'язкові поля

| Поле | Тип | Опис |
| --- | --- | --- |
| `name` | string | Ідентифікатор маркетплейсу, kebab-case, без пробілів. **Публічний**: користувачі бачать його як `/plugin install my-tool@<name>`. У користувача може бути лише один маркетплейс з даним ім'ям — додавання другого з тим самим ім'ям **замінює** перший. |
| `owner` | object | `{ name: string (обов'язково), email?: string }` |
| `plugins` | array | Список плагінів (може бути порожнім `[]` — це валідно, лише warning) |

### Опційні поля

| Поле | Тип | Опис |
| --- | --- | --- |
| `$schema` | string | URL JSON Schema для автокомпліту в редакторі. Claude Code ігнорує при завантаженні. Офіційний репо використовує `https://anthropic.com/claude-code/marketplace.schema.json` |
| `description` | string | Короткий опис маркетплейсу (без нього — warning при валідації) |
| `version` | string | Версія маніфесту каталогу |
| `metadata.pluginRoot` | string | Базова тека, що додається до відносних шляхів. З `"./plugins"` можна писати `"source": "formatter"` замість `"source": "./plugins/formatter"` |
| `allowCrossMarketplaceDependenciesOn` | array | Інші маркетплейси, від яких дозволено залежати. Не вказані — залежність блокується при встановленні |
| `renames` | object | Мапа старе-ім'я → нове-ім'я або `null` (видалено). Потребує Claude Code ≥ 2.1.193. Див. §9 |

`description` і `version` також приймаються всередині `metadata` — для зворотної сумісності.

### Зарезервовані назви

Не можна використовувати: `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`,
`claude-plugins-community`, `claude-community`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`,
`anthropic-agent-skills`, `knowledge-work-plugins`, `life-sciences`, `claude-for-legal`,
`claude-for-financial-services`, `financial-services-plugins`, `first-party-plugins`, `healthcare`.

Також блокуються назви-імітації офіційних: `official-claude-plugins`, `anthropic-plugins-v2` тощо.

⚠️ Claude Code перевіряє зарезервовані назви **при кожному завантаженні** маркетплейсу, не лише при додаванні.
Якщо назва стане зарезервованою пізніше — маркетплейс перестане вантажитись із помилкою
«registered from an untrusted source», і його доведеться перододати під іншим ім'ям.

`dev-digest-ai-marketplace` / `ai-marketplace` — вільні.

### Запис плагіна

**Обов'язкові:** `name` (kebab-case, публічний), `source`.

**Опційні (метадані):**

| Поле | Тип | Опис |
| --- | --- | --- |
| `displayName` | string | Людиночитна назва в UI. Може містити пробіли й будь-який регістр. Не використовується для неймспейсингу. Потребує ≥ 2.1.143 |
| `description` | string | Короткий опис |
| `version` | string | Версія. Якщо задана — плагін запінено, оновлення лише при зміні рядка. Див. §7 |
| `author` | object | `{ name (обов'язково), email? }` |
| `homepage` | string | URL документації |
| `repository` | string | URL вихідного коду |
| `license` | string | SPDX-ідентифікатор (`MIT`, `Apache-2.0`) |
| `keywords` | array | Теги для пошуку |
| `category` | string | Категорія для організації |
| `tags` | array | Теги для пошуку |
| `strict` | boolean | Чи є `plugin.json` авторитетом для компонентів. За замовчуванням `true` |
| `relevance` | object | Сигнали, коли пропонувати плагін. Діє лише для маркетплейсів у managed-allowlist. Потребує ≥ 2.1.152 |
| `defaultEnabled` | boolean | Чи увімкнено після встановлення (default `true`). Має пріоритет над тим самим полем у `plugin.json`. Потребує ≥ 2.1.154 |

**Опційні (шляхи компонентів):** `skills`, `commands`, `agents`, `hooks`, `mcpServers`, `lspServers` —
string або array (для hooks/mcpServers/lspServers — ще й inline-об'єкт).

### `strict`

| Значення | Поведінка |
| --- | --- |
| `true` (default) | `plugin.json` — авторитет. Запис у каталозі може **доповнити** його; обидва джерела зливаються |
| `false` | Запис у каталозі — **повне** визначення. Якщо плагін ще й має `plugin.json` з компонентами — конфлікт, плагін не завантажиться |

`strict: false` корисний, коли оператор маркетплейсу хоче повний контроль: репо плагіна дає «сирі» файли,
а каталог вирішує, що з них експонувати.

### Приклад

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "dev-digest-ai-marketplace",
  "description": "Internal catalog of DevDigest skills, agents and plugins",
  "owner": {
    "name": "DevDigest AI Engineering",
    "email": "roman.minenok@gmail.com"
  },
  "plugins": []
}
```

## 5. Джерела плагінів (`source`)

| Тип | Форма | Поля | Нотатки |
| --- | --- | --- | --- |
| Відносний шлях | `"./plugins/my-plugin"` | — | Має починатися з `./`. Резолвиться від кореня маркетплейсу. `..` заборонено |
| `github` | object | `repo` (обов'язково, `owner/repo`), `ref?`, `sha?` | |
| `url` | object | `url` (обов'язково), `ref?`, `sha?` | Будь-який git URL (`https://` або `git@`). Суфікс `.git` опційний |
| `git-subdir` | object | `url`, `path` (обов'язкові), `ref?`, `sha?` | Тека всередині репо. Sparse/partial clone — економить трафік на монорепо. `url` приймає й шорткат `owner/repo` |
| `npm` | object | `package` (обов'язково), `version?`, `registry?` | Через `npm install`. `version` приймає діапазони (`^2.0.0`, `~1.5.0`) |

**`ref` vs `sha`:** якщо задані обидва — діє `sha`, Claude Code фетчить і чекаутить саме цей коміт.
На GitHub/GitLab/Bitbucket встановлення спрацює, навіть якщо гілку/тег з `ref` вже видалено, доки коміт
досяжний. На серверах без фетчу за SHA (AWS CodeCommit) `ref` має існувати.

Приклад із офіційного репо Anthropic — рекомендований патерн для зовнішніх плагінів:

```json
{
  "name": "42crunch-api-security-testing",
  "description": "...",
  "author": { "name": "42Crunch" },
  "category": "security",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/42Crunch-AI/claude-plugins.git",
    "path": "plugins/api-security-testing",
    "ref": "v1.5.5",
    "sha": "30287f5e3f122a646d1ac5ca3ab96e130c52a3ad"
  },
  "homepage": "https://42crunch.com"
}
```

### ⚠️ Пастка: відносні шляхи + URL-дистрибуція

Якщо користувач додає маркетплейс **прямим URL** на `marketplace.json`
(`/plugin marketplace add https://example.com/marketplace.json`), завантажується **лише цей файл**.
Відносні шляхи `"./plugins/..."` тоді мовчки не резолвляться → помилки «path not found».
Для URL-дистрибуції треба використовувати `github`/`npm`/`url`-джерела.
Для git-хостингу (наш випадок) відносні шляхи працюють — репо клонується цілком.

### Спільна тека `skills/` на кілька записів

Якщо кілька записів мають `source: "./"` і ділять одну теку `skills/` у корені, треба перелічити
конкретні підтеки, щоб кожен запис вантажив лише своє:

```json
"source": "./",
"skills": ["./skills/code-review", "./skills/docs"]
```

При `source` = корінь маркетплейсу перелічені шляхи — це **повний набір** для запису; інші теки в
спільній `skills/` не завантажаться. Якщо вказати `./skills/` або корінь плагіна — повне сканування
залишається. Якщо жоден із перелічених шляхів не існує — відпрацює дефолтне сканування.

## 6. Схема `plugin.json`

Файл `.claude-plugin/plugin.json`. **Маніфест опційний** — без нього Claude Code автовиявляє компоненти
в дефолтних локаціях і бере ім'я плагіна з імені теки. Маніфест потрібен для метаданих і кастомних шляхів.

Якщо маніфест є — **`name` єдине обов'язкове поле**. Ім'я використовується для неймспейсингу:
агент `agent-creator` у плагіні `plugin-dev` показується як `plugin-dev:agent-creator`.

### Повна схема

```json
{
  "name": "plugin-name",
  "displayName": "Plugin Name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": { "name": "Author Name", "email": "a@example.com", "url": "https://github.com/author" },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "skills": "./custom/skills/",
  "commands": ["./custom/commands/special.md"],
  "agents": ["./custom/agents/reviewer.md"],
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json",
  "experimental": { "themes": "./themes/", "monitors": "./monitors.json" },
  "dependencies": ["helper-lib", { "name": "secrets-vault", "version": "~2.1.0" }]
}
```

### Поля-шляхи компонентів

| Поле | Поведінка |
| --- | --- |
| `skills` | **Додає** до дефолтного сканування `skills/` (виняток — marketplace-root, див. §5) |
| `commands` | **Замінює** дефолтну `commands/` |
| `agents` | **Замінює** дефолтну `agents/` |
| `hooks`, `mcpServers`, `lspServers` | Шляхи або inline-конфіг |
| `outputStyles` | Замінює дефолтну `output-styles/` |
| `experimental.themes`, `experimental.monitors` | Теми, фонові монітори |
| `userConfig` | Значення, які запитуються в користувача при увімкненні |
| `channels` | Декларації каналів для message injection (Telegram/Slack/Discord) |
| `dependencies` | Інші плагіни-залежності, опційно з semver-обмеженням |

### Нерозпізнані поля

Claude Code **ігнорує** нерозпізнані топ-рівневі поля. Тобто один `plugin.json` може одночасно бути
маніфестом VS Code/Cursor-розширення, npm `package.json` або MCPB/DXT-бандла.

`claude plugin validate` рапортує їх як **warnings**, не errors; якщо поле на 1–2 символи відрізняється
від відомого — підкаже правильне. Але **неправильний тип** розпізнаного поля — це помилка завантаження
(наприклад, `keywords` рядком замість масиву).

`--strict` перетворює warnings на errors — саме це треба в CI.

### `defaultEnabled`

`defaultEnabled: false` → плагін ставиться вимкненим, користувач вмикає вручну. Корисно для плагінів,
що додають вартість або лізуть у зовнішні сервіси. Пріоритети (від вищого):

1. Явна настройка користувача в `enabledPlugins` (будь-який scope) — переживає оновлення й переустановки.
2. Вимога залежності — якщо плагін потрібен іншому активному, Claude Code пише `true`.
3. `defaultEnabled` у записі маркетплейсу.
4. `defaultEnabled` у `plugin.json`.

## 7. Версіонування — головна пастка

Версія визначає шлях у кеші та детект оновлень: якщо резолвлена версія збігається з наявною в
користувача, `/plugin update` і автооновлення **пропускають** плагін.

Порядок резолву (перше задане виграє):

1. `version` у `plugin.json` плагіна
2. `version` у записі маркетплейсу
3. **git commit SHA** джерела плагіна

### Два робочі підходи

| Підхід | Коли | Як |
| --- | --- | --- |
| **Без `version`** | Внутрішні / активно розроблювані плагіни | Не вказувати `version` взагалі → кожен коміт = нова версія. Найпростіше |
| **З `version`** | Публічні / стабільні релізи | Вказати `version` і **бампати з кожним релізом**. Інакше нові коміти нічого не змінять для наявних користувачів |

⚠️ **Ніколи не задавати `version` в обох місцях.** Claude Code завжди бере значення з `plugin.json`
**без попередження** — застарілий маніфест мовчки замаскує версію, задану в `marketplace.json`.

### Release channels

Два маркетплейси, що вказують на різні `ref`/`sha` того самого репо (`stable-tools` / `latest-tools`),
роздаються різним групам через managed settings.

⚠️ Кожен канал має резолвитись у **різну** версію. З явними версіями — `plugin.json` має декларувати
різний `version` на кожному запіненому ref. Без `version` — різні SHA вже розрізняють канали.
Якщо два ref резолвляться в однаковий рядок версії — Claude Code вважає їх ідентичними й пропускає оновлення.

## 8. Кешування та резолвінг шляхів

Плагіни **копіюються** в кеш `~/.claude/plugins/cache`, а не використовуються in-place. Наслідки:

- ❌ Шляхи назовні теки плагіна (`../shared-utils`) **не працюють** — ці файли не копіюються.
- ✅ Для спільних файлів між плагінами — **симлінки**.
- ✅ У хуках і MCP-конфігах шляхи писати через **`${CLAUDE_PLUGIN_ROOT}`**.
- ✅ Для залежностей/стану, що мають пережити оновлення плагіна — **`${CLAUDE_PLUGIN_DATA}`**.

```json
"hooks": {
  "PostToolUse": [{
    "matcher": "Write|Edit",
    "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh" }]
  }]
},
"mcpServers": {
  "enterprise-db": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
  }
}
```

## 9. Перейменування та видалення плагінів

`name` плагіна — **стабільний ідентифікатор**. Користувачі посилаються на нього в `enabledPlugins`,
`pluginConfigs` і командах `/plugin install`. Зміна `name` ламає **всі** наявні інсталяції.

- Щоб змінити лише підпис в UI — `displayName`, `name` не чіпати.
- Щоб реально перейменувати/видалити — топ-рівневе поле `renames`:

```json
{
  "name": "acme-tools",
  "owner": { "name": "Acme" },
  "plugins": [{ "name": "code-formatter", "source": "./plugins/code-formatter" }],
  "renames": {
    "formatter": "code-formatter",
    "legacy-linter": null
  }
}
```

Поведінка: Claude Code вантажить плагін під новим ім'ям, показує однорядкове повідомлення й **переписує**
старий ключ на новий у user/project/local scope для `enabledPlugins` і `pluginConfigs`. Для `null` —
дропає ключ і каже, що плагін видалено. Для віддалених джерел (`github`, `npm`) після перейменування
буде `plugin-cache-miss` — користувач має раз запустити `/plugin install`.

**Правила:**

- `renames` — **append-only історія**. Не редагувати старі записи, додавати нові: Claude Code йде ланцюжком.
- `claude plugin validate .` відхиляє цикли й ланцюжки, що не закінчуються на `null` або на ім'я зі списку `plugins`.
- Managed/policy settings read-only → там перейменування не перепишеться автоматично, повідомлення
  повторюватиметься, доки адмін не оновить `enabledPlugins`.
- Claude Code < 2.1.193 ігнорує `renames` і рапортує `plugin-not-found`.

Офіційний репо Anthropic активно цим користується:

```json
"renames": {
  "adlc": "agentforce-adlc",
  "airwallex": "airwallex-agentos",
  "convex-backend": "convex",
  "vals": "valtown",
  "wordpress.com": "build-with-wordpress"
}
```

## 10. Валідація і CI

```bash
claude plugin validate .                    # маркетплейс: схема, дублі імен, path traversal
claude plugin validate ./plugins/my-plugin  # плагін: plugin.json + frontmatter скілів/агентів/хуків
claude plugin validate ./plugins/my-plugin --strict   # warnings → errors (для CI)
```

Усередині сесії: `/plugin validate .`

**Що перевіряє валідатор маркетплейсу:** схему `marketplace.json`, дублікати імен плагінів,
path traversal у `source`. Для записів із локальним шляхом — ще й їхній `plugin.json`, і попереджає,
коли `version` у записі не збігається з `plugin.json`. Проблеми в `plugin.json` префіксуються індексом
запису: `plugins[2] plugin.json →`.

### Типові помилки

| Помилка | Причина | Рішення |
| --- | --- | --- |
| `File not found: .claude-plugin/marketplace.json` | Немає маніфесту | Створити з обов'язковими полями |
| `Invalid JSON syntax: Unexpected token...` | Синтаксис JSON | Коми, лапки |
| `Duplicate plugin name "x" found in marketplace` | Два плагіни з однаковим `name` | Унікальні імена |
| `plugins[0].source: Path contains ".."` | `..` у шляху | Шляхи від кореня маркетплейсу без `..` |
| `YAML frontmatter failed to parse: ...` | Битий YAML у скілі/агенті/команді | Файл завантажиться без метаданих. Рапортується лише при валідації теки плагіна |
| `Invalid JSON syntax: ...` (hooks.json) | Битий `hooks/hooks.json` | **Блокує завантаження всього плагіна** |

### Warnings (не блокують)

- `Marketplace has no plugins defined` — порожній `plugins: []` валідний
- `No marketplace description provided` — додати топ-рівневий `description`
- `Plugin name "x" is not kebab-case` — ⚠️ документація це обіцяє, але **на практиці не спрацьовує** (див. нижче)

### ⚠️ Що валідатор насправді НЕ ловить (перевірено на v2.1.212)

Ці висновки з **емпіричної перевірки на фікстурах**, а не з документації. Наведений маніфест
проходить `claude plugin validate` **чисто, навіть із `--strict`**:

```json
{
  "name": "Test_Marketplace",
  "owner": { "name": "Test" },
  "plugins": [
    { "name": "Bad_Name", "source": "./plugins/real" },
    { "name": "ghost", "source": "./plugins/does-not-exist" }
  ]
}
```

| Проблема | Документація обіцяє | Реальність v2.1.212 |
| --- | --- | --- |
| Зарезервована назва маркетплейсу (`anthropic-plugins`) | Блокується при завантаженні | ✗ Валідатор мовчить |
| Не-kebab назва маркетплейсу (`Test_Marketplace`) | — | ✗ Мовчить |
| Не-kebab назва плагіна (`Bad_Name`) | Warning | ✗ Мовчить |
| `source` вказує на неіснуючу теку | — | ✗ Мовчить — ламається лише в користувача при `/plugin install` |
| `plugin.json.name` ≠ імені запису | За дизайном дозволено (виграє запис) | ✗ Мовчить (очікувано) |

Що **таки** ловить (теж перевірено): `..` у `source` (error), дублікати імен плагінів (error),
відсутність `version`/`description`/`author` у `plugin.json` (warnings), порожній `plugins: []` (warning).

**Помилки обривають решту перевірок.** З `..` у списку дублікати вже не рапортуються — їх видно лише
після виправлення першої помилки. Тобто зелений валідатор ≠ «все перевірено», і прогін варто повторювати
після кожного виправлення.

Саме ці прогалини закриває `scripts/validate-marketplace.mjs` — він не дублює офіційний валідатор.

### `--strict` падає на порожньому каталозі

`claude plugin validate . --strict` виходить з **кодом 1**, доки `plugins: []` порожній
(`Marketplace has no plugins defined` — warning, а `--strict` робить з нього error).
Тому CI використовує `--strict` лише для окремих плагінів, а каталог валідує без нього.
Перемкнути можна буде після появи першого плагіна.

### CI не потребує авторизації

Перевірено: `claude plugin validate` відпрацьовує headless **без `ANTHROPIC_API_KEY` і навіть без `HOME`**.
Отже, в GitHub Actions достатньо `npm install -g @anthropic-ai/claude-code` — секрет не потрібен.

### Що робить офіційний репо Anthropic

Дев'ять workflow-ів у `.github/workflows/`:

| Workflow | Призначення |
| --- | --- |
| `validate-plugins.yml` | Валідація плагінів |
| `validate-frontmatter.yml` | Перевірка YAML-frontmatter скілів/агентів |
| `validate-licenses.yml` | Перевірка ліцензій |
| `scan-plugins.yml` | Сканування вмісту |
| `bump-plugin-shas.yml` | Автобамп запінених SHA |
| `revert-failed-bumps.yml` | Відкат невдалих бампів |
| `check-mcp-urls.yml` | Перевірка доступності MCP-URL |
| `close-external-prs.yml` | Політика зовнішніх PR |
| `external-pr-scope-guard.yml` | Обмеження scope зовнішніх PR |

Мінімум для нас: один workflow на `pull_request` з `claude plugin validate . --strict`.

## 11. Безпека та командна дистрибуція

### Безпека

Плагіни виконують **повністю довірений код** у сесії розробника: скіли запускають shell-команди,
MCP-сервери ставлять довільні бінарники, хуки перехоплюють кожен виклик тулзи.

Захист — це **allowlist маркетплейсів + runtime-хуки + людське код-рев'ю перед потраплянням у каталог**,
а не автоматичні сканери.

Практика спільноти: **пінити на commit SHA, а не на тег** — теги рухаються, коміти ні. Це спосіб
детерміновано роздавати плагіни на велику організацію без випадкових апгрейдів на зламану версію.

Типова помилка: покласти теку зі скілами в приватний GitHub-репо **без** `marketplace.json`. Це пропускає
весь шар маркетплейсу — немає пінування версій, немає enforcement через managed settings, немає чистого
механізму оновлення. Працює на 5 людей, ламається на 500.

### Автопідключення для команди

`.claude/settings.json` у робочому репозиторії (не в репо маркетплейсу):

```json
{
  "extraKnownMarketplaces": {
    "dev-digest-ai-marketplace": {
      "source": { "source": "github", "repo": "RomanMinenok/ai-marketplace" }
    }
  },
  "enabledPlugins": {
    "code-formatter@dev-digest-ai-marketplace": true
  }
}
```

Стан маркетплейсів зберігається **раз на користувача** в `~/.claude/plugins/known_marketplaces.json`,
не по проєктах. При роботі з git worktree відносні `directory`/`file`-шляхи резолвляться від головного
checkout — усі worktree ділять одну локацію маркетплейсу.

### Managed-обмеження (для організації)

`strictKnownMarketplaces` у managed settings:

| Значення | Поведінка |
| --- | --- |
| Undefined | Без обмежень |
| `[]` | Повний локдаун — жодних нових маркетплейсів |
| Список джерел | Лише ті, що точно збігаються |

Матчинг **точний**, без нормалізації URL: трейлінг-слеш, суфікс `.git`, `ssh://` vs `https://` — різні
значення. Якщо репо клонується кількома формами URL — краще `hostPattern`-запис:

```json
{ "strictKnownMarketplaces": [{ "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }] }
```

Перевірка виконується **до** будь-якої мережевої/файлової операції — на add, install, update, refresh
і автооновленні.

### Приватні репозиторії

- Ручні install/update використовують ваші git credential helpers (`gh auth login`, Keychain) — працює як у терміналі.
- SSH працює, якщо хост уже в `known_hosts`, а ключ у `ssh-agent` (Claude Code глушить інтерактивні промпти).
- ⚠️ **Фонові автооновлення** за замовчуванням **вимикають** credential helpers для `git pull` → HTTPS до
  приватних репо не автентифікується. SSH-remote не зачеплений. При фейлі — повний re-clone, який
  credentials використовує, але може впертися в таймаут на великих репо.
- `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1` — не видаляти клон при фейлі пулу.
- `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` — таймаут git-операцій (дефолт 120 с).
- `GITHUB_TOKEN` у середовищі **сам по собі не вмикає** фонову автентифікацію — токен діє лише через
  налаштований credential helper.
- GitHub `owner/repo` шорткати клонуються через **SSH** за замовчуванням; `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` → HTTPS.

### Пресід для контейнерів/CI

`CLAUDE_CODE_PLUGIN_SEED_DIR` — тека, що дзеркалить `~/.claude/plugins`:

```
$CLAUDE_CODE_PLUGIN_SEED_DIR/
  known_marketplaces.json
  marketplaces/<name>/...
  cache/<marketplace>/<plugin>/<version>/...
```

Read-only, автооновлення вимкнені, seed має пріоритет над конфігом користувача.
Будувати можна через `CLAUDE_CODE_PLUGIN_CACHE_DIR=/opt/claude-seed claude plugin install ...`.

## 12. Чек-ліст перевірки

Пройтися після наповнення репозиторію:

- [ ] `.claude-plugin/marketplace.json` існує в корені, `name` kebab-case і не з reserved-списку
- [ ] `owner.name` заповнений реальним значенням (не плейсхолдером)
- [ ] Топ-рівневий `description` присутній (інакше warning)
- [ ] Усі `name` плагінів унікальні й kebab-case (інакше синк із claude.ai відхилить)
- [ ] Жоден `source` не містить `..`
- [ ] Стратегія версій обрана свідомо і **не дублюється** між `plugin.json` і `marketplace.json`
- [ ] Немає посилань назовні теки плагіна (`../`); де треба — симлінки
- [ ] У хуках/MCP використано `${CLAUDE_PLUGIN_ROOT}`, а не відносні/абсолютні шляхи
- [ ] `claude plugin validate . --strict` зелений
- [ ] `claude plugin validate ./plugins/<кожен>` зелений
- [ ] CI-workflow на `pull_request` працює
- [ ] Локальний прогін: `/plugin marketplace add ./` → `/plugin install <plugin>@<name>` → скіл викликається
- [ ] `renames` заповнено, якщо щось перейменовували/видаляли
- [ ] README пояснює, як підключити й що всередині

## 13. Кандидати на плагіни з `dev-digest`

> Інвентар на 2026-07-17. **Що саме переносити — ще не вирішено.**

### Агенти (`~/Workspace/dev-digest/.claude/agents/`)

Покривають цикл **Spec → Plan → Implement → Test → Verify → Review → Document**:

| Агент | Модель | Роль |
| --- | --- | --- |
| `spec-creator` | opus | Пише SDD-специфікації, EARS-питання, лише `/specs/**` + `/design/**` |
| `researcher` | sonnet | Read-only дослідник — факти з коду або вебу |
| `implementation-planner` | opus | Read-only архітектор — Implementation Plan, Onion, розбиття на задачі |
| `implementer` | sonnet | Виконує **одну** задачу плану; опційна worktree-ізоляція |
| `test-writer` | sonnet · worktree | Пише/розширює тести, ітерує до зеленого |
| `architecture-reviewer` | opus | Read-only архітектурне рев'ю — Onion dependency rule, межі шарів, цикли |
| `architecture-reviewer-lite` | — | Полегшена версія |
| `plan-verifier` | opus | Read-only аудит повноти — traceability matrix вимога→`path:line` |
| `doc-writer` | sonnet | Документація з наявного матеріалу, Diátaxis, Mermaid |

### Скіли (`~/Workspace/dev-digest/.claude/skills/`)

| Скоуп | Скіли |
| --- | --- |
| Backend | `onion-architecture`, `onion-architecture-workspace`, `fastify-best-practices`, `drizzle-orm-patterns`, `postgresql-table-design` |
| Frontend | `next-best-practices`, `react-best-practices`, `react-component-architecture`, `react-testing-library` |
| Full-stack | `zod`, `typescript-expert`, `security` |
| Shared | `mermaid-diagram`, `dependency-checker` |
| Workflow | `engineering-insights`, `pr-self-review`, `implement-plan`, `workflow-retro` |

### ⚠️ Важливо: не всі скіли — наші

`dev-digest/skills-lock.json` показує, що частина скілів **вендорена з чужих GitHub-репо**
(з `source`, `sourceType`, `skillPath`, `computedHash`):

| Скіл | Джерело |
| --- | --- |
| `architecture-patterns` | `sickn33/antigravity-awesome-skills` |
| `drizzle-orm-patterns` | `giuseppe-trisciuoglio/developer-kit` |
| `fastify-best-practices` | `mcollina/skills` |
| `github-workflow-automation` | `ruvnet/ruflo` |
| `next-best-practices` | `vercel-labs/next-skills` |
| `postgresql-table-design` | `wshobson/agents` |
| … | (повний список — у `skills-lock.json`) |

**Наслідок:** вендорені скіли **не варто** класти у власні плагіни й перевидавати під своїм ім'ям —
це питання ліцензій і атрибуції. Правильний шлях — посилатися на них у каталозі як на зовнішні
джерела (`github` / `git-subdir` із `ref`+`sha`), як це робить офіційний репо Anthropic.
Власними є, схоже, ті, яких немає в lock-файлі (`onion-architecture`, `pr-self-review`,
`implement-plan`, `workflow-retro`, `engineering-insights`, …) — **треба звірити поіменно**.

### Хуки

`.claude/hooks/engineering-insights-read.sh`, `.claude/hooks/engineering-insights-stop.sh` —
пов'язані зі скілом `engineering-insights`; якщо переносити скіл, хуки їдуть із ним у той самий плагін.

### Ідея групування (чернетка)

Не по одному плагіну на скіл, а тематичними бандлами:

| Плагін | Вміст |
| --- | --- |
| `devdigest-sdd-workflow` | Агенти циклу Spec→Doc + скіли `implement-plan`, `pr-self-review`, `workflow-retro`, `engineering-insights` + хуки |
| `devdigest-backend` | `onion-architecture`, `fastify-*`, `drizzle-*`, `postgresql-*` |
| `devdigest-frontend` | `next-*`, `react-*` × 3 |
| `devdigest-foundation` | `zod`, `typescript-expert`, `security`, `mermaid-diagram` |

## 14. Рішення та відкриті питання

### Зафіксовано

| Питання | Рішення |
| --- | --- |
| Ім'я маркетплейсу | **`seasoned-ai-marketplace`** (репо лишається `RomanMinenok/ai-marketplace` — ім'я в маніфесті не мусить збігатися з іменем репо) |
| Де живуть плагіни | **Моно-репо**: `plugins/<name>/`, відносні шляхи `"./plugins/x"`. Легко розділити пізніше |
| Версіонування | **Явний SemVer у `plugin.json`** + bump-check у CI. Не задавати `version` у записі каталогу — `plugin.json` виграє мовчки |
| Власний лінтер | **Потрібен.** Офіційний валідатор не ловить зарезервовані назви, kebab-case і неіснуючі теки (див. §10). `scripts/validate-marketplace.mjs` |
| Secrets scan | **Жорсткий fail**, без allowlist |
| Третьосторонні скіли | Не перевидавати як свої — посилатися зовнішнім джерелом із `ref` + повним `sha` |

### Лишилось відкритим

1. **`owner`**: зараз `{"name": "Roman Minenok", "email": "roman.minenok@gmail.com"}` — замінити на
   командний, якщо потрібно.
2. **LICENSE**: не створено свідомо. Для приватного/командного репо MIT недоречний, а вигадувати
   пропрієтарні формулювання — не моя справа. Треба рішення.
3. **Які саме скіли/агенти** переносити з `dev-digest` — і які з них наші, а які вендорені (§13).
   Потрібна поіменна звірка зі `skills-lock.json`.
4. **Групування плагінів**: бандли (`seasoned-sdd-workflow`, `seasoned-backend`, …) чи по одному
   плагіну на скіл? Чернетка в §13, рішення — після перших 2–3 плагінів
   («explore first, standardise later»).
