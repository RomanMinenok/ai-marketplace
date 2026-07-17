# Security

## The threat model

Plugins run **fully trusted code inside a developer's Claude Code session**:

- skills execute shell commands,
- MCP servers install and run arbitrary binaries,
- hooks intercept every tool call — including the ones that read your files and secrets.

There is no sandbox between a plugin and the developer's machine. Anything merged into this catalog
runs on every machine that installs it, with that developer's credentials.

**The defense is human review before merge, plus pinning.** Not automated scanners — the linter's
secret scan catches careless mistakes, not a determined one. Treat every plugin PR as if you were
granting shell access to everyone on the team, because you are.

## Review checklist

Before approving a plugin PR:

- [ ] **Read every script.** `hooks/*.sh`, `skills/*/scripts/*` — all of it, line by line.
- [ ] **No network calls** to hosts we don't control, unless the PR explains why.
- [ ] **No `curl | sh`**, no downloading and executing anything at runtime.
- [ ] **No secrets** — no tokens, keys, `.env` contents, no credentials in examples.
- [ ] **No absolute paths** (`/Users/…`, `/home/…`). Plugins are copied to a cache dir; absolute
      paths either break or point at someone else's machine.
- [ ] **`${CLAUDE_PLUGIN_ROOT}`** used for anything inside the plugin.
- [ ] **MCP servers**: what does the server do, where does it send data, who publishes it?
- [ ] **Hooks**: which tools does the matcher catch, and what does the command do with them?
      A `PreToolUse` hook sees everything.
- [ ] **External sources pinned to a full 40-char `sha`**, not just a tag. Tags move; commits don't.

## Secrets

Never commit secrets to this repo — not in a plugin, not in an example, not in a doc.

CI runs a hard-fail scan over `plugins/**` for absolute home paths, `AKIA…` keys, PEM blocks,
`token=`, and provider tokens (`sk_`, `ghp_`, …). There is **no allowlist** — if it trips, fix the
content rather than the pattern. If a legitimate case needs an exception, raise it in the PR and we
change the rule deliberately.

If a secret does land in a commit: rotate it first, then clean the history. Rotation is the fix;
removing the commit is cleanup.

## Pinning external plugins

Skills and plugins vendored from third-party repositories are referenced as external sources, never
copied in and republished as ours. Pin both a readable `ref` and an exact `sha`:

```json
{
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/vendor/repo.git",
    "path": "skills/thing",
    "ref": "v1.2.0",
    "sha": "<full-40-char-sha>"
  }
}
```

When both are set, the `sha` is what actually gets checked out. This is how you ship deterministic
plugins without a developer silently picking up whatever the vendor pushed to that tag this morning.
Bumping a vendored plugin is a deliberate PR that updates the `sha` — and a re-review.

## Auto-update

Auto-updates pull new commits automatically. Combined with unpinned sources, that means third-party
code changes on developer machines with no review. Hence: pin external sources, review every bump.

## Branch protection

CI only helps if it can't be bypassed. `Validate marketplace` should be a **required status check**
on `main`, with direct pushes disabled. That's configured in the GitHub UI (Settings → Branches),
not in this repo — see [../README.md](../README.md#branch-protection).

## Reporting

Found something in an installed plugin? Disable it first (`/plugin disable <name>`), then open an
issue. Don't wait to be sure.
