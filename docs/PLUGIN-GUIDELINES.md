# Plugin guidelines

How to build a plugin for this marketplace. Background and citations: [../MARKETPLACE-RESEARCH.md](../MARKETPLACE-RESEARCH.md).

## Structure

Plugins live in `plugins/<plugin-name>/` and are referenced from the catalog by a relative path.

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json          # manifest — optional, but we require it (see below)
├── skills/
│   └── my-skill/
│       ├── SKILL.md         # required for a skill
│       ├── examples.md      # optional
│       └── scripts/         # optional
├── agents/
│   └── reviewer.md
├── commands/
│   └── thing.md             # flat .md slash commands
└── hooks/
    └── hooks.json
```

`skills/`, `agents/`, `commands/`, `hooks/` are auto-discovered — you only list them in the manifest
when you need non-default paths.

## Manifest

`name` is the only field Claude Code requires, but **this marketplace requires** `name`, `version`,
`description` and `author` so the catalog stays readable and updates actually reach users.

```json
{
  "name": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "description": "One sentence on what this plugin does",
  "author": { "name": "Roman Minenok" },
  "keywords": ["backend", "architecture"]
}
```

### Naming

- `name` must be **kebab-case**. Claude Code tolerates other forms, but the claude.ai marketplace
  sync rejects them, and our CI warns.
- `name` is a **stable identifier**. Changing it breaks every existing install. Use `displayName`
  to change how it reads in the UI; use the catalog's `renames` map to actually rename. See
  [RELEASES.md](RELEASES.md).
- `name` namespaces components: agent `reviewer` in plugin `my-plugin` shows up as `my-plugin:reviewer`.

### Versioning: explicit SemVer, in `plugin.json` only

Every plugin declares a SemVer `version` in its `plugin.json`, and **every release bumps it**.
A forgotten bump means users silently never receive the update — Claude Code sees the same version
and keeps the cached copy. CI enforces this: if files under `plugins/<name>/` change in a PR, the
version must differ from the base branch.

Never set `version` in **both** `plugin.json` and the catalog entry — `plugin.json` wins **without a
warning**, so a stale manifest would silently mask the catalog. CI rejects a `version` in the entry.

See [RELEASES.md](RELEASES.md) for the release process.

## Paths: the cache rule

Plugins are **copied** into `~/.claude/plugins/cache` on install, not used in place. So:

- ❌ Never reference anything outside the plugin directory (`../shared-utils`) — it isn't copied.
- ✅ Use `${CLAUDE_PLUGIN_ROOT}` in hook commands and MCP server configs.
- ✅ Use `${CLAUDE_PLUGIN_DATA}` for state that must survive plugin updates.
- ✅ Need to share files across plugins? Symlinks.

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh" }]
    }]
  }
}
```

## Keep `SKILL.md` portable

A skill is just Markdown + YAML frontmatter. Keep it that way — plain Markdown body, minimal
frontmatter, no Claude-Code-only constructs in the prose. Other agent tooling reads the same
format, and a portable skill survives a move between `.claude/skills/`, this marketplace, and
whatever comes next. Put Claude-Code-specific wiring (hooks, MCP servers, custom paths) in
`plugin.json`, not inside the skill body.

## CHANGELOG

Each plugin keeps a `plugins/<name>/CHANGELOG.md`. One entry per released version, newest first,
saying what changed for the *user* of the plugin — not what files moved.

```markdown
# Changelog

## 1.1.0
- Added a check for X

## 1.0.0
- Initial release
```

## Catalog entry

Add your plugin to `.claude-plugin/marketplace.json`. We require `name`, `source`, `description`
and `category`:

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "One sentence on what this plugin does",
  "category": "backend"
}
```

Relative paths resolve from the **marketplace root** (the directory containing `.claude-plugin/`),
not from inside it. `..` is rejected by the validator.

### Third-party skills

Skills vendored from someone else's repository do **not** get republished as our own plugin.
Reference them as an external source, pinned to both a tag and an exact commit:

```json
{
  "name": "next-best-practices",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/vercel-labs/next-skills.git",
    "path": "skills/next-best-practices",
    "ref": "v1.2.0",
    "sha": "<full-40-char-sha>"
  },
  "description": "Next.js App Router, RSC boundaries, data fetching",
  "category": "frontend",
  "author": { "name": "Vercel Labs" },
  "homepage": "https://github.com/vercel-labs/next-skills"
}
```

Tags move; commits don't. Pin the `sha`. Check `dev-digest/skills-lock.json` to see which skills
are vendored before assuming a skill is ours.

## Validate before opening a PR

```bash
claude plugin validate .                              # catalog: schema, dupes, path traversal
claude plugin validate ./plugins/my-plugin --strict   # your plugin: manifest + YAML frontmatter
```

`--strict` turns warnings into errors — including unrecognized manifest fields and leftovers from
other tools' manifests.

> A malformed `hooks/hooks.json` stops the **entire plugin** from loading. Broken YAML frontmatter
> in a skill loads the file with no metadata instead of failing loudly. The validator catches both,
> but only when pointed at the plugin directory.

## Test locally

```bash
claude plugin marketplace add ./
claude plugin install my-plugin@seasoned-ai-marketplace
```

Then actually invoke the skill (`/my-plugin:my-skill`) — a passing validator only proves the JSON
and frontmatter parse, not that the plugin does anything useful.
