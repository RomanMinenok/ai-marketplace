# Architecture Review

A single read-only agent, `architecture-reviewer`, for **structural** code
review — is this in the right place, and does the dependency point the
right way? Not a linter, not a completeness checker.

## What's inside

| Agent | Model | Tools | Role |
| --- | --- | --- | --- |
| `architecture-reviewer` | opus | Read, Grep, Glob, Bash (read-only) | Reviews the dependency rule, layer boundaries, coupling/cohesion, cycles, domain richness, leaky ports, and pattern consistency. Findings ranked by severity + confidence, each anchored to `path:line`. |

Depends on [`engineering-paved-path`](../engineering-paved-path/README.md)
for its `layered-architecture`, `react-component-architecture`, and
`mermaid-diagram` skills — installing this plugin pulls that one in
automatically.

## Using it

Delegate to `architecture-reviewer` (`subagent_type:
"architecture-review:architecture-reviewer"`) after implementing a change,
or whenever a design's structural soundness is in question.

**It has no built-in assumption about your stack or layering convention.**
Before reviewing, it establishes a module map — from what you tell it, from
a convention file in the repo (`CLAUDE.md`, `ARCHITECTURE.md`, …), or from a
short exploration pass — and states that map explicitly at the top of its
report. If you already know your project's module boundaries, say so in the
dispatch prompt to save it the exploration pass.

It checks seven categories: the inward dependency rule, layer boundaries,
coupling & cohesion, cyclic dependencies, anemic-vs-rich domain, leaky
ports/abstractions, and pattern consistency — see the agent's own "What an
architecture review checks" section for detail on each.

## Output

A structured report: scope reviewed, the module map used, an overall
verdict (`sound` / `sound-with-risks` / `has architectural defects`),
findings most-severe-first (each rated `Critical`/`High`/`Medium`/`Low`
severity and `High`/`Medium`/`Low` confidence, with a `path:line` and a
suggested direction), optional dependency notes, and a "respected by
design" section for things that look off but are intentional per the
repo's own conventions.

## What it won't do

- Never edits code, never runs mutating commands, never opens a PR — no
  Edit/Write tools; `Bash` is read-only evidence gathering only.
- Doesn't do line-level review (naming, `any`, missing null checks) or
  requirement-completeness checks — those belong to a different tool in
  your pipeline.
- Never invents a `path:line` — if it can't cite evidence, it doesn't raise
  the finding.

## Install

```
/plugin marketplace add ./
/plugin install architecture-review@seasoned-ai-marketplace
```
