# Marketplace Research

> Research: how to properly create and maintain a Claude Code plugin marketplace repository.
> Collected from the official Claude Code documentation, the real `anthropics/claude-plugins-official`
> repository, and community practices. Date: 2026-07-17.
>
> **Purpose of this file:** a reference of decisions and pitfalls. Once the repository has been
> populated, go through this document again and verify nothing was missed (see §12 "Verification checklist").

## Contents

1. [Sources](#1-sources)
2. [The model: what a marketplace is and how it works](#2-the-model-what-a-marketplace-is-and-how-it-works)
3. [Repository structure](#3-repository-structure)
4. [`marketplace.json` schema](#4-marketplacejson-schema)
5. [Plugin sources (`source`)](#5-plugin-sources-source)
6. [`plugin.json` schema](#6-pluginjson-schema)
7. [Versioning — the main pitfall](#7-versioning--the-main-pitfall)
8. [Caching and path resolution](#8-caching-and-path-resolution)
9. [Renaming and removing plugins](#9-renaming-and-removing-plugins)
10. [Validation and CI](#10-validation-and-ci)
11. [Security and team-wide distribution](#11-security-and-team-wide-distribution)
12. [Verification checklist](#12-verification-checklist)
13. [Plugin candidates from `dev-digest`](#13-plugin-candidates-from-dev-digest)
14. [Open questions](#14-open-questions)

---

## 1. Sources

| Source | What it gave |
| --- | --- |
| [Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) | Main guide: structure, `marketplace.json` schema, source types, hosting, versioning, troubleshooting |
| [Plugins reference](https://code.claude.com/docs/en/plugins-reference) | Full `plugin.json` schema, plugin components, paths, `${CLAUDE_PLUGIN_ROOT}` |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Real-world example: repo structure, pinning by `ref`+`sha`, `renames`, 9 CI workflows |
| [Your Claude Plugin Marketplace Needs More Than a Git Repo](https://www.mpt.solutions/your-claude-plugin-marketplace-needs-more-than-a-git-repo/) | Practices: why a bare git repo isn't enough, review as a safeguard, pinning to SHA |
| [Build Your Own Claude Code Marketplace](https://dev.to/nagell/build-your-own-claude-code-marketplace-scaffold-structure-and-auto-updates-4n3f) | Scaffolding, auto-updates |
| [Claude Code Plugins: From Personal Setup to Org Standard](https://claudefa.st/blog/tools/mcp-extensions/plugins-distribution) | Moving from a personal set of tools to an organizational standard |

## 2. The model: what a marketplace is and how it works

A marketplace is a **git repository with a catalog file** `.claude-plugin/marketplace.json`. It doesn't
necessarily host the plugin code itself — it's just a **catalog** that says where to find it. Plugins can
live in the same repo (relative paths) or in any other repositories/npm.

Lifecycle:

1. You push changes to the marketplace repository.
2. The user adds the marketplace: `/plugin marketplace add RomanMinenok/ai-marketplace`.
3. The user installs a plugin: `/plugin install <plugin>@<marketplace-name>`.
4. Catalog updates: `/plugin marketplace update`; plugin updates: `/plugin update` or auto-update.

Claude Code copies the plugin into a local cache at `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.

**Key architectural idea:** *marketplace source* and *plugin source* are different things.
The former is where to get `marketplace.json` itself (set by the user on `add`, supports `ref`, but not `sha`).
The latter is where to get a specific plugin (set in the entry's `source` field, supports both `ref` and `sha`).
So a single catalog can point to a dozen different repos, each pinned independently.

## 3. Repository structure

The minimum is `.claude-plugin/marketplace.json` at the root. The real official Anthropic repository
(`anthropics/claude-plugins-official`) looks like this:

```
.claude-plugin/
  marketplace.json
.github/
  workflows/           # 9 workflows (see §10)
.gitignore
LICENSE
README.md
external_plugins/      # plugins from external authors
plugins/               # in-house plugins
```

Structure of an individual plugin inside `plugins/`:

```
plugins/my-plugin/
  .claude-plugin/
    plugin.json        # manifest; optional, but needed for metadata
  skills/
    <skill-name>/
      SKILL.md         # required skill file
      reference.md     # optional
      scripts/         # optional
  agents/
    reviewer.md
  commands/
    thing.md           # "flat" .md commands
  hooks/
    hooks.json
```

**Placement rules:**

- `marketplace.json` — **only** in `.claude-plugin/` at the repo root.
- Relative paths in `source` resolve from the **marketplace root** (the folder that contains `.claude-plugin/`),
  not from `.claude-plugin/` itself. So `"./plugins/my-plugin"` → `<repo>/plugins/my-plugin`.
- `..` in `source` is forbidden — the validator rejects it (`Path contains ".."`).

## 4. `marketplace.json` schema

### Required fields

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Marketplace identifier, kebab-case, no spaces. **Public**: users see it as `/plugin install my-tool@<name>`. A user can only have one marketplace with a given name — adding a second one with the same name **replaces** the first. |
| `owner` | object | `{ name: string (required), email?: string }` |
| `plugins` | array | List of plugins (can be empty `[]` — that's valid, just a warning) |

### Optional fields

| Field | Type | Description |
| --- | --- | --- |
| `$schema` | string | JSON Schema URL for editor autocomplete. Claude Code ignores it on load. The official repo uses `https://anthropic.com/claude-code/marketplace.schema.json` |
| `description` | string | Short description of the marketplace (missing — warning on validation) |
| `version` | string | Catalog manifest version |
| `metadata.pluginRoot` | string | Base folder prepended to relative paths. With `"./plugins"` you can write `"source": "formatter"` instead of `"source": "./plugins/formatter"` |
| `allowCrossMarketplaceDependenciesOn` | array | Other marketplaces this one is allowed to depend on. Not listed — the dependency is blocked on install |
| `renames` | object | Map of old-name → new-name or `null` (removed). Requires Claude Code ≥ 2.1.193. See §9 |

`description` and `version` are also accepted inside `metadata` — for backward compatibility.

### Reserved names

Cannot be used: `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`,
`claude-plugins-community`, `claude-community`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`,
`anthropic-agent-skills`, `knowledge-work-plugins`, `life-sciences`, `claude-for-legal`,
`claude-for-financial-services`, `financial-services-plugins`, `first-party-plugins`, `healthcare`.

Names imitating official ones are also blocked: `official-claude-plugins`, `anthropic-plugins-v2`, etc.

⚠️ Claude Code checks reserved names **on every load** of the marketplace, not just on add.
If a name becomes reserved later, the marketplace will stop loading with a
"registered from an untrusted source" error, and you'll have to re-publish it under another name.

`dev-digest-ai-marketplace` / `ai-marketplace` — free.

### Plugin entry

**Required:** `name` (kebab-case, public), `source`.

**Optional (metadata):**

| Field | Type | Description |
| --- | --- | --- |
| `displayName` | string | Human-readable name in the UI. Can contain spaces and any case. Not used for namespacing. Requires ≥ 2.1.143 |
| `description` | string | Short description |
| `version` | string | Version. If set, the plugin is pinned — updates only happen when the string changes. See §7 |
| `author` | object | `{ name (required), email? }` |
| `homepage` | string | Documentation URL |
| `repository` | string | Source code URL |
| `license` | string | SPDX identifier (`MIT`, `Apache-2.0`) |
| `keywords` | array | Search tags |
| `category` | string | Organizational category |
| `tags` | array | Search tags |
| `strict` | boolean | Whether `plugin.json` is the authority for components. Defaults to `true` |
| `relevance` | object | Signals for when to suggest the plugin. Only applies to marketplaces on the managed allowlist. Requires ≥ 2.1.152 |
| `defaultEnabled` | boolean | Whether it's enabled after install (default `true`). Takes priority over the same field in `plugin.json`. Requires ≥ 2.1.154 |

**Optional (component paths):** `skills`, `commands`, `agents`, `hooks`, `mcpServers`, `lspServers` —
string or array (for hooks/mcpServers/lspServers — also an inline object).

### `strict`

| Value | Behavior |
| --- | --- |
| `true` (default) | `plugin.json` is the authority. The catalog entry can **supplement** it; both sources are merged |
| `false` | The catalog entry is the **complete** definition. If the plugin also has a `plugin.json` with components — conflict, the plugin won't load |

`strict: false` is useful when the marketplace operator wants full control: the plugin repo provides
"raw" files, and the catalog decides what to expose from them.

### Example

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

## 5. Plugin sources (`source`)

| Type | Form | Fields | Notes |
| --- | --- | --- | --- |
| Relative path | `"./plugins/my-plugin"` | — | Must start with `./`. Resolves from the marketplace root. `..` forbidden |
| `github` | object | `repo` (required, `owner/repo`), `ref?`, `sha?` | |
| `url` | object | `url` (required), `ref?`, `sha?` | Any git URL (`https://` or `git@`). `.git` suffix optional |
| `git-subdir` | object | `url`, `path` (required), `ref?`, `sha?` | Folder inside the repo. Sparse/partial clone — saves bandwidth on monorepos. `url` also accepts the `owner/repo` shorthand |
| `npm` | object | `package` (required), `version?`, `registry?` | Via `npm install`. `version` accepts ranges (`^2.0.0`, `~1.5.0`) |

**`ref` vs `sha`:** if both are set, `sha` wins — Claude Code fetches and checks out exactly that commit.
On GitHub/GitLab/Bitbucket the install works even if the branch/tag from `ref` has already been deleted, as
long as the commit is reachable. On servers without fetch-by-SHA (AWS CodeCommit), `ref` must exist.

Example from the official Anthropic repo — the recommended pattern for external plugins:

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

### ⚠️ Pitfall: relative paths + URL distribution

If a user adds the marketplace via a **direct URL** to `marketplace.json`
(`/plugin marketplace add https://example.com/marketplace.json`), **only that file** gets loaded.
Relative paths `"./plugins/..."` then silently fail to resolve → "path not found" errors.
For URL distribution you must use `github`/`npm`/`url` sources.
For git hosting (our case), relative paths work — the whole repo is cloned.

### Shared `skills/` folder across multiple entries

If several entries have `source: "./"` and share a single `skills/` folder at the root, you need to
list the specific subfolders so each entry loads only its own:

```json
"source": "./",
"skills": ["./skills/code-review", "./skills/docs"]
```

When `source` is the marketplace root, the listed paths become the **complete** set for that entry;
other folders in the shared `skills/` won't load. If you specify `./skills/` or the plugin root, full
scanning still applies. If none of the listed paths exist, the default scan kicks in.

## 6. `plugin.json` schema

The file `.claude-plugin/plugin.json`. **The manifest is optional** — without it, Claude Code auto-discovers
components in default locations and takes the plugin name from the folder name. The manifest is needed for
metadata and custom paths.

If a manifest exists, **`name` is the only required field**. The name is used for namespacing:
the agent `agent-creator` in the `plugin-dev` plugin shows up as `plugin-dev:agent-creator`.

### Full schema

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

### Component path fields

| Field | Behavior |
| --- | --- |
| `skills` | **Adds** to the default `skills/` scan (exception — marketplace-root, see §5) |
| `commands` | **Replaces** the default `commands/` |
| `agents` | **Replaces** the default `agents/` |
| `hooks`, `mcpServers`, `lspServers` | Paths or inline config |
| `outputStyles` | Replaces the default `output-styles/` |
| `experimental.themes`, `experimental.monitors` | Themes, background monitors |
| `userConfig` | Values requested from the user on enable |
| `channels` | Channel declarations for message injection (Telegram/Slack/Discord) |
| `dependencies` | Other plugin dependencies, optionally with a semver constraint |

### Unrecognized fields

Claude Code **ignores** unrecognized top-level fields. This means a single `plugin.json` can simultaneously
be a manifest for a VS Code/Cursor extension, an npm `package.json`, or an MCPB/DXT bundle.

`claude plugin validate` reports them as **warnings**, not errors; if a field differs by 1–2 characters
from a known one, it suggests the correct name. But an **incorrect type** for a recognized field is a
load error (e.g. `keywords` as a string instead of an array).

`--strict` turns warnings into errors — that's what you want in CI.

### `defaultEnabled`

`defaultEnabled: false` → the plugin installs disabled, the user enables it manually. Useful for plugins
that add cost or reach out to external services. Priority order (highest first):

1. Explicit user setting in `enabledPlugins` (any scope) — survives updates and reinstalls.
2. Dependency requirement — if a plugin is needed by another active one, Claude Code writes `true`.
3. `defaultEnabled` in the marketplace entry.
4. `defaultEnabled` in `plugin.json`.

## 7. Versioning — the main pitfall

The version determines the cache path and update detection: if the resolved version matches the one the
user already has, `/plugin update` and auto-update **skip** the plugin.

Resolution order (first one set wins):

1. `version` in the plugin's `plugin.json`
2. `version` in the marketplace entry
3. **git commit SHA** of the plugin's source

### Two working approaches

| Approach | When | How |
| --- | --- | --- |
| **No `version`** | Internal / actively developed plugins | Don't set `version` at all → every commit is a new version. Simplest |
| **With `version`** | Public / stable releases | Set `version` and **bump it with every release**. Otherwise new commits won't change anything for existing users |

⚠️ **Never set `version` in both places.** Claude Code always takes the value from `plugin.json`
**without warning** — a stale manifest will silently mask the version set in `marketplace.json`.

### Release channels

Two marketplaces pointing at different `ref`/`sha` of the same repo (`stable-tools` / `latest-tools`)
are distributed to different groups via managed settings.

⚠️ Each channel must resolve to a **different** version. With explicit versions — `plugin.json` must
declare a different `version` on each pinned ref. Without `version`, different SHAs already distinguish
the channels. If two refs resolve to the same version string, Claude Code considers them identical and
skips the update.

## 8. Caching and path resolution

Plugins are **copied** into the `~/.claude/plugins/cache` cache, not used in-place. Consequences:

- ❌ Paths outside the plugin's folder (`../shared-utils`) **don't work** — those files aren't copied.
- ✅ For files shared between plugins — use **symlinks**.
- ✅ In hooks and MCP configs, write paths using **`${CLAUDE_PLUGIN_ROOT}`**.
- ✅ For dependencies/state that must survive a plugin update — **`${CLAUDE_PLUGIN_DATA}`**.

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

## 9. Renaming and removing plugins

A plugin's `name` is a **stable identifier**. Users reference it in `enabledPlugins`,
`pluginConfigs`, and `/plugin install` commands. Changing `name` breaks **all** existing installs.

- To change only the UI label — use `displayName`, don't touch `name`.
- To actually rename/remove — use the top-level `renames` field:

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

Behavior: Claude Code loads the plugin under the new name, shows a one-line message, and **rewrites**
the old key to the new one in the user/project/local scope for `enabledPlugins` and `pluginConfigs`.
For `null`, it drops the key and says the plugin was removed. For remote sources (`github`, `npm`),
after renaming there will be a `plugin-cache-miss` — the user needs to run `/plugin install` once.

**Rules:**

- `renames` is an **append-only history**. Don't edit old entries, add new ones — Claude Code follows the chain.
- `claude plugin validate .` rejects cycles and chains that don't terminate at `null` or at a name from the `plugins` list.
- Managed/policy settings are read-only → renaming won't rewrite automatically there; the message will
  keep repeating until an admin updates `enabledPlugins`.
- Claude Code < 2.1.193 ignores `renames` and reports `plugin-not-found`.

The official Anthropic repo actively uses this:

```json
"renames": {
  "adlc": "agentforce-adlc",
  "airwallex": "airwallex-agentos",
  "convex-backend": "convex",
  "vals": "valtown",
  "wordpress.com": "build-with-wordpress"
}
```

## 10. Validation and CI

```bash
claude plugin validate .                    # marketplace: schema, duplicate names, path traversal
claude plugin validate ./plugins/my-plugin  # plugin: plugin.json + skill/agent/hook frontmatter
claude plugin validate ./plugins/my-plugin --strict   # warnings → errors (for CI)
```

Inside a session: `/plugin validate .`

**What the marketplace validator checks:** the `marketplace.json` schema, duplicate plugin names,
path traversal in `source`. For entries with a local path — also their `plugin.json`, and it warns
when the `version` in the entry doesn't match `plugin.json`. Problems in `plugin.json` are prefixed
with the entry index: `plugins[2] plugin.json →`.

### Common errors

| Error | Cause | Fix |
| --- | --- | --- |
| `File not found: .claude-plugin/marketplace.json` | No manifest | Create it with the required fields |
| `Invalid JSON syntax: Unexpected token...` | JSON syntax | Commas, quotes |
| `Duplicate plugin name "x" found in marketplace` | Two plugins with the same `name` | Unique names |
| `plugins[0].source: Path contains ".."` | `..` in path | Paths from the marketplace root, no `..` |
| `YAML frontmatter failed to parse: ...` | Broken YAML in a skill/agent/command | The file loads without metadata. Only reported when validating the plugin folder |
| `Invalid JSON syntax: ...` (hooks.json) | Broken `hooks/hooks.json` | **Blocks loading of the whole plugin** |

### Warnings (non-blocking)

- `Marketplace has no plugins defined` — an empty `plugins: []` is valid
- `No marketplace description provided` — add a top-level `description`
- `Plugin name "x" is not kebab-case` — ⚠️ the docs promise this, but **in practice it doesn't fire** (see below)

### ⚠️ What the validator actually does NOT catch (verified on v2.1.212)

These findings come from **empirical testing on fixtures**, not from the docs. The manifest below
passes `claude plugin validate` **cleanly, even with `--strict`**:

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

| Problem | Docs promise | Reality on v2.1.212 |
| --- | --- | --- |
| Reserved marketplace name (`anthropic-plugins`) | Blocked on load | ✗ Validator stays silent |
| Non-kebab-case marketplace name (`Test_Marketplace`) | — | ✗ Silent |
| Non-kebab-case plugin name (`Bad_Name`) | Warning | ✗ Silent |
| `source` points to a nonexistent folder | — | ✗ Silent — only breaks for the user on `/plugin install` |
| `plugin.json.name` ≠ entry name | Allowed by design (entry wins) | ✗ Silent (expected) |

What it **does** catch (also verified): `..` in `source` (error), duplicate plugin names (error),
missing `version`/`description`/`author` in `plugin.json` (warnings), an empty `plugins: []` (warning).

**Errors abort the rest of the checks.** With `..` in the list, duplicates are no longer reported —
they only show up after fixing the first error. In other words, a green validator ≠ "everything checked",
and it's worth re-running after each fix.

`scripts/validate-marketplace.mjs` closes exactly these gaps — it doesn't duplicate the official validator.

### `--strict` fails on an empty catalog

`claude plugin validate . --strict` exits with **code 1** as long as `plugins: []` is empty
(`Marketplace has no plugins defined` is a warning, and `--strict` turns it into an error).
So CI uses `--strict` only for individual plugins, and validates the catalog without it.
This can be switched once the first plugin lands.

### CI needs no authorization

Verified: `claude plugin validate` runs headless **without `ANTHROPIC_API_KEY` and even without `HOME`**.
So in GitHub Actions, `npm install -g @anthropic-ai/claude-code` is enough — no secret needed.

### What the official Anthropic repo does

Nine workflows in `.github/workflows/`:

| Workflow | Purpose |
| --- | --- |
| `validate-plugins.yml` | Plugin validation |
| `validate-frontmatter.yml` | Skill/agent YAML frontmatter check |
| `validate-licenses.yml` | License check |
| `scan-plugins.yml` | Content scanning |
| `bump-plugin-shas.yml` | Auto-bump pinned SHAs |
| `revert-failed-bumps.yml` | Revert failed bumps |
| `check-mcp-urls.yml` | MCP URL availability check |
| `close-external-prs.yml` | External PR policy |
| `external-pr-scope-guard.yml` | External PR scope restriction |

The minimum for us: one workflow on `pull_request` with `claude plugin validate . --strict`.

## 11. Security and team-wide distribution

### Security

Plugins execute **fully trusted code** in the developer's session: skills run shell commands,
MCP servers install arbitrary binaries, hooks intercept every tool call.

The defense is an **allowlist of marketplaces + runtime hooks + human review before anything lands
in the catalog**, not automatic scanners.

Community practice: **pin to a commit SHA, not a tag** — tags move, commits don't. This is how you
deterministically distribute plugins across a large organization without accidental upgrades to a
broken version.

Common mistake: putting a folder of skills in a private GitHub repo **without** `marketplace.json`.
This skips the entire marketplace layer — no version pinning, no enforcement via managed settings,
no clean update mechanism. Works for 5 people, breaks at 500.

### Auto-connect for a team

`.claude/settings.json` in the working repository (not the marketplace repo):

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

Marketplace state is stored **once per user** in `~/.claude/plugins/known_marketplaces.json`,
not per project. When working with a git worktree, relative `directory`/`file` paths resolve from
the main checkout — all worktrees share one marketplace location.

### Managed restrictions (for an organization)

`strictKnownMarketplaces` in managed settings:

| Value | Behavior |
| --- | --- |
| Undefined | No restrictions |
| `[]` | Full lockdown — no new marketplaces |
| List of sources | Only exact matches |

Matching is **exact**, with no URL normalization: trailing slash, `.git` suffix, `ssh://` vs `https://`
are different values. If the repo gets cloned via multiple URL forms, a `hostPattern` entry is better:

```json
{ "strictKnownMarketplaces": [{ "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }] }
```

The check runs **before** any network/file operation — on add, install, update, refresh, and auto-update.

### Private repositories

- Manual install/update use your git credential helpers (`gh auth login`, Keychain) — works like in a terminal.
- SSH works if the host is already in `known_hosts` and the key is in `ssh-agent` (Claude Code suppresses interactive prompts).
- ⚠️ **Background auto-updates** by default **disable** credential helpers for `git pull` → HTTPS to
  private repos won't authenticate. SSH remotes are unaffected. On failure, a full re-clone happens,
  which does use credentials, but may hit a timeout on large repos.
- `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1` — don't delete the clone on a pull failure.
- `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` — git operation timeout (default 120s).
- `GITHUB_TOKEN` in the environment **alone doesn't enable** background authentication — the token only
  works through a configured credential helper.
- GitHub `owner/repo` shortcuts clone via **SSH** by default; `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` → HTTPS.

### Seeding for containers/CI

`CLAUDE_CODE_PLUGIN_SEED_DIR` — a folder that mirrors `~/.claude/plugins`:

```
$CLAUDE_CODE_PLUGIN_SEED_DIR/
  known_marketplaces.json
  marketplaces/<name>/...
  cache/<marketplace>/<plugin>/<version>/...
```

Read-only, auto-updates disabled, the seed takes priority over user config.
Can be built via `CLAUDE_CODE_PLUGIN_CACHE_DIR=/opt/claude-seed claude plugin install ...`.

## 12. Verification checklist

Go through this after populating the repository:

- [ ] `.claude-plugin/marketplace.json` exists at the root, `name` is kebab-case and not on the reserved list
- [ ] `owner.name` is filled in with a real value (not a placeholder)
- [ ] A top-level `description` is present (otherwise a warning)
- [ ] All plugin `name`s are unique and kebab-case (otherwise sync with claude.ai will reject them)
- [ ] No `source` contains `..`
- [ ] A versioning strategy was chosen deliberately and is **not duplicated** between `plugin.json` and `marketplace.json`
- [ ] No references outside a plugin's folder (`../`); use symlinks where needed
- [ ] Hooks/MCP configs use `${CLAUDE_PLUGIN_ROOT}`, not relative/absolute paths
- [ ] `claude plugin validate . --strict` is green
- [ ] `claude plugin validate ./plugins/<each>` is green
- [ ] CI workflow on `pull_request` works
- [ ] Local dry run: `/plugin marketplace add ./` → `/plugin install <plugin>@<name>` → the skill gets invoked
- [ ] `renames` is filled in if anything was renamed/removed
- [ ] README explains how to connect and what's inside

## 13. Plugin candidates from `dev-digest`

> Inventory as of 2026-07-17. **What exactly to migrate is still undecided.**

### Agents (`~/Workspace/dev-digest/.claude/agents/`)

Cover the **Spec → Plan → Implement → Test → Verify → Review → Document** cycle:

| Agent | Model | Role |
| --- | --- | --- |
| `spec-creator` | opus | Writes SDD specs, EARS questions, only `/specs/**` + `/design/**` |
| `researcher` | sonnet | Read-only researcher — facts from code or the web |
| `implementation-planner` | opus | Read-only architect — Implementation Plan, Onion, task breakdown |
| `implementer` | sonnet | Executes **one** plan task; optional worktree isolation |
| `test-writer` | sonnet · worktree | Writes/extends tests, iterates until green |
| `architecture-reviewer` | opus | Read-only architecture review — Onion dependency rule, layer boundaries, cycles |
| `architecture-reviewer-lite` | — | Lightweight version |
| `plan-verifier` | opus | Read-only completeness audit — requirement→`path:line` traceability matrix |
| `doc-writer` | sonnet | Documentation from existing material, Diátaxis, Mermaid |

### Skills (`~/Workspace/dev-digest/.claude/skills/`)

| Scope | Skills |
| --- | --- |
| Backend | `onion-architecture`, `onion-architecture-workspace`, `fastify-best-practices`, `drizzle-orm-patterns`, `postgresql-table-design` |
| Frontend | `next-best-practices`, `react-best-practices`, `react-component-architecture`, `react-testing-library` |
| Full-stack | `zod`, `typescript-expert`, `security` |
| Shared | `mermaid-diagram`, `dependency-checker` |
| Workflow | `engineering-insights`, `pr-self-review`, `implement-plan`, `workflow-retro` |

### ⚠️ Important: not all skills are ours

`dev-digest/skills-lock.json` shows that some skills are **vendored from other people's GitHub repos**
(with `source`, `sourceType`, `skillPath`, `computedHash`):

| Skill | Source |
| --- | --- |
| `architecture-patterns` | `sickn33/antigravity-awesome-skills` |
| `drizzle-orm-patterns` | `giuseppe-trisciuoglio/developer-kit` |
| `fastify-best-practices` | `mcollina/skills` |
| `github-workflow-automation` | `ruvnet/ruflo` |
| `next-best-practices` | `vercel-labs/next-skills` |
| `postgresql-table-design` | `wshobson/agents` |
| … | (full list — in `skills-lock.json`) |

**Consequence:** vendored skills **should not** be put into our own plugins and re-published under our
name — that's a licensing and attribution issue. The right path is to reference them in the catalog as
external sources (`github` / `git-subdir` with `ref`+`sha`), the way the official Anthropic repo does.
The ones that appear to be ours are those absent from the lock file (`onion-architecture`, `pr-self-review`,
`implement-plan`, `workflow-retro`, `engineering-insights`, …) — **needs a name-by-name check**.

### Hooks

`.claude/hooks/engineering-insights-read.sh`, `.claude/hooks/engineering-insights-stop.sh` —
tied to the `engineering-insights` skill; if the skill is migrated, the hooks go with it into the same plugin.

### Grouping idea (draft)

Not one plugin per skill, but thematic bundles:

| Plugin | Contents |
| --- | --- |
| `devdigest-sdd-workflow` | Spec→Doc cycle agents + skills `implement-plan`, `pr-self-review`, `workflow-retro`, `engineering-insights` + hooks |
| `devdigest-backend` | `onion-architecture`, `fastify-*`, `drizzle-*`, `postgresql-*` |
| `devdigest-frontend` | `next-*`, `react-*` × 3 |
| `devdigest-foundation` | `zod`, `typescript-expert`, `security`, `mermaid-diagram` |

## 14. Decisions and open questions

### Decided

| Question | Decision |
| --- | --- |
| Marketplace name | **`seasoned-ai-marketplace`** (the repo stays `RomanMinenok/ai-marketplace` — the name in the manifest doesn't need to match the repo name) |
| Where plugins live | **Mono-repo**: `plugins/<name>/`, relative paths `"./plugins/x"`. Easy to split later |
| Versioning | **Explicit SemVer in `plugin.json`** + a bump-check in CI. Don't set `version` in the catalog entry — `plugin.json` silently wins |
| Custom linter | **Needed.** The official validator doesn't catch reserved names, kebab-case, or nonexistent folders (see §10). `scripts/validate-marketplace.mjs` |
| Secrets scan | **Hard fail**, no allowlist |
| Third-party skills | Don't re-publish as our own — reference via an external source with `ref` + full `sha` |

### Still open

1. **`owner`**: currently `{"name": "Roman Minenok", "email": "roman.minenok@gmail.com"}` — replace with
   a team one if needed.
2. **LICENSE**: deliberately not created. For a private/team repo, MIT doesn't fit, and inventing
   proprietary wording isn't my call. Needs a decision.
3. **Which skills/agents exactly** to migrate from `dev-digest` — and which of them are ours vs. vendored
   (§13). Needs a name-by-name check against `skills-lock.json`.
4. **Plugin grouping**: bundles (`seasoned-sdd-workflow`, `seasoned-backend`, …) or one plugin per skill?
   Draft in §13, decision after the first 2–3 plugins ("explore first, standardise later").
