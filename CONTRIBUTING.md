# Contributing

How to change this catalog safely. Read [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md) for
plugin structure and [docs/SECURITY.md](docs/SECURITY.md) before adding anything that runs code.

## Principle: explore first, standardise later

This catalog is young. Don't over-engineer governance before 2–3 real plugins exist and we can see
what the actual patterns are. Add process when something has hurt us, not in anticipation.

## Add a plugin

1. Create `plugins/<name>/` following [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md).
   `<name>` must be kebab-case and stable — renaming it later breaks every install.
2. Write `plugins/<name>/.claude-plugin/plugin.json` with `name`, `version` (SemVer),
   `description`, `author`.
3. Start `plugins/<name>/CHANGELOG.md` at `1.0.0`.
4. Add the entry to `.claude-plugin/marketplace.json` — `name`, `source: "./plugins/<name>"`,
   `description`, `category`. **No `version`** in the entry.
5. Add a `CODEOWNERS` line if this plugin has a specific owner.
6. Validate and test locally (below).
7. Open a PR.

## Add a third-party skill

Skills vendored from someone else's repository do **not** get republished as our plugin — that's a
licensing and attribution problem. Reference them as an external source pinned to `ref` + full `sha`,
with `author` and `homepage` crediting the original. See
[docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md#third-party-skills).

Check `dev-digest/skills-lock.json` before assuming a skill is ours.

## Validate locally

```bash
node scripts/validate-marketplace.mjs                    # structural lint (what CI runs first)
claude plugin validate .                                 # official: catalog
claude plugin validate ./plugins/<name> --strict         # official: your plugin
```

Both run in CI on every PR. Run them locally first — it's faster than a red build.

> Neither one proves the plugin *works*. A green validator means the JSON and YAML parse.

## Test locally

```bash
claude plugin marketplace add ./
claude plugin install <name>@seasoned-ai-marketplace
```

Then actually invoke the skill (`/<name>:<skill>`) and watch it do the thing.

For a quick loop without installing, point Claude Code straight at the directory:

```bash
claude --plugin-dir ./plugins/<name>
```

## PR checklist

- [ ] `node scripts/validate-marketplace.mjs` green
- [ ] `claude plugin validate .` green
- [ ] `claude plugin validate ./plugins/<name> --strict` green
- [ ] Plugin actually invoked and observed working — not just validated
- [ ] `version` bumped in `plugin.json` (required for any change to an existing plugin)
- [ ] `CHANGELOG.md` updated
- [ ] No secrets, no absolute paths (`/Users/…`, `/home/…`)
- [ ] `${CLAUDE_PLUGIN_ROOT}` used for in-plugin paths
- [ ] External sources pinned to a full 40-char `sha`
- [ ] `CODEOWNERS` updated if this is a new plugin
- [ ] README catalog table updated

## Renaming or removing

Never just change a `name` or delete an entry — that's a `plugin-not-found` for everyone who has it
installed. Use the `renames` map. See [docs/RELEASES.md](docs/RELEASES.md#renaming-or-removing-a-plugin).
