# Specification: SDD Engineering plugin family (extraction from `dev-digest`)

## Context

Source repo: `~/Workspace/dev-digest` (`.claude/agents/`, `.claude/skills/`,
`evals/`, `skills-lock.json`). Target: this marketplace (`ai-marketplace`),
per [`docs/PLUGIN-GUIDELINES.md`](../PLUGIN-GUIDELINES.md) and
[`docs/RELEASES.md`](../RELEASES.md). `plugins/` is currently empty
(`.gitkeep` only) — this is the first real population.

Four plugins, matching the provided slide deck (Steps 2–5):

| Plugin | Kind | Ships |
| --- | --- | --- |
| `engineering-paved-path` | dependency | React, Next.js, Fastify, architecture, testing, security skills |
| `research-tools` | dependency | read-only `researcher` agent |
| `architecture-review` | dependency | generalized `architecture-reviewer` agent |
| `sdd-engineering` | consumer | 4 SDD agents + `run-plan` skill + `retro` workflow, depends on the three above |

## What moves, what doesn't (Step 2)

**In:**
- `sdd-engineering` takes `spec-creator`, `implementation-planner`,
  `implementer`, `plan-verifier` from `.claude/agents/*.md`.
- `run-plan` = dev-digest's `implement-plan` skill
  (`.claude/skills/implement-plan/SKILL.md`) — executes an already-approved
  plan.
- `retro` workflow = dev-digest's `workflow-retro` skill
  (`.claude/skills/workflow-retro/SKILL.md`) — analyzes a finished run.
- `researcher` → `research-tools`; `architecture-reviewer` → `architecture-review`
  (renamed at the plugin level; agent stays `architecture-reviewer` inside it).

**Not carried over** (per the deck, "Not carried over"):
- Product specs (`specs/*.md` themselves — the *process* moves, not any
  existing spec content).
- Secrets (none expected, but `.mcp.json`/`.env`-shaped anything is excluded).
- Cache (`evals/node_modules`, `evals/results/*`, anything gitignored).
- DevDigest-specific instructions — every reference to `server/`, `client/`,
  `reviewer-core/`, `@devdigest/api`, `INSIGHTS.md` module routing tables,
  and the 5-package tsconfig-alias layout must be stripped or turned into
  explicit inputs the caller supplies (see "Generalization work" below).

**Explicitly out of this pass**: `test-writer`, `doc-writer`,
`architecture-reviewer-lite`, `dependency-checker`, `pr-self-review`,
`engineering-insights` (+ its two hooks), `onion-architecture-workspace`.
Not mentioned in the deck's Step 2 selection — leave in `dev-digest` for now.

## Generalization work (new, not just a copy)

**Decided**: full framework-agnostic rewrite (not a placeholder-only pass) —
these agents/skills must genuinely work outside DevDigest, with the module
map supplied at runtime, not baked in.

Two things in the source are DevDigest-specific and need real rewriting, not
just a file move:

1. **`architecture-reviewer`** (`.claude/agents/architecture-reviewer.md`) —
   "The project (know this cold)" section hardcodes the 5-package table
   (`server/`, `client/`, `reviewer-core/`, vendored `shared`) and the Onion
   dependency rule against those literal paths. `architecture-review`'s
   agent must take the module map as a **runtime input** (from the plan or
   the invoking prompt) instead of a baked-in table, while keeping the
   7-category checklist (dependency rule, layer boundaries, coupling/cohesion,
   cycles, anemic domain, leaky ports, pattern consistency) and the
   severity+confidence findings format, which are project-agnostic already.
2. **`onion-architecture` skill** — frontmatter says *"Enforces Onion
   Architecture for new backend modules in `@devdigest/api`"* and maps layers
   to `service.ts`/`repository.ts`/`platform/container.ts` literally. Needs
   the same treatment: keep the four-layer model, drop the file-name mapping
   to DevDigest's concrete files, or reframe it as an example rather than the
   rule. Same question applies to `react-component-architecture` (says "in
   this project (Next.js 15 + Mantine)") if it ends up in
   `engineering-paved-path`.

`plan-verifier` and `implementer`/`implementation-planner` also reference the
5-package table and the skills-routing table (`server/src/**` →
`fastify-best-practices, onion-architecture, zod, ...`). These need the same
"parametrize the module map" treatment — `implementation-planner` in
particular hardcodes `docs/plan/<name>.md` as the output path and a
DevDigest-specific skills matrix; both stay conceptually right but the table
becomes something the plan or a project config supplies, not a literal in
the agent body.

## Dependency graph (Step 3)

```
engineering-paved-path  ──┐
research-tools          ──┼──▶ sdd-engineering (^1.0.0 each)
architecture-review     ──┘
```

`sdd-engineering/.claude-plugin/plugin.json` declares all three as
dependencies, per the existing convention in
[`docs/RELEASES.md`](../RELEASES.md#dependencies):

```json
{
  "dependencies": [
    { "name": "engineering-paved-path", "version": "^1.0.0" },
    { "name": "research-tools", "version": "^1.0.0" },
    { "name": "architecture-review", "version": "^1.0.0" }
  ]
}
```

## `engineering-paved-path` — skill sourcing decision

`skills-lock.json` shows several of the deck's named skills are **vendored
from third-party repos** (`fastify-best-practices` ← `mcollina/skills`,
`next-best-practices` ← `vercel-labs/next-skills`, `typescript-expert` ←
`sickn33/antigravity-awesome-skills`). Per
[`docs/PLUGIN-GUIDELINES.md`](../PLUGIN-GUIDELINES.md#third-party-skills),
those must **not** be re-published as our own files — they need their own
catalog entries pinned to `ref` + full `sha`. Only the ones absent from
`skills-lock.json` are genuinely first-party and can live inside
`engineering-paved-path/skills/`: `react-best-practices`,
`react-component-architecture` (needs the generalization above),
`react-testing-library`, `security`, `mermaid-diagram`,
`onion-architecture` (needs the generalization above).

**Decided**: `engineering-paved-path` bundles the first-party skills
directly, and additionally lists the third-party skills as its own
`dependencies` (each registered separately in `marketplace.json` as an
external `git-subdir` source), so installing `engineering-paved-path` alone
still pulls in React/Next.js/Fastify/testing coverage as the deck describes,
without this marketplace re-hosting someone else's skill text. Confirmed
against [Claude Code plugin-dependencies docs](https://code.claude.com/docs/en/plugin-dependencies):
`plugin.json`'s `dependencies` array accepts both bare names and
`{ "name", "version" }` semver-constrained objects — exactly the shape
`docs/RELEASES.md` already documents.

## `sdd-engineering` packaging (Step 4)

- Moves: 4 agents, `run-plan` skill, `retro` workflow-skill, plus
  `evals/agents/architecture-reviewer` and `evals/agents/architecture-reviewer-lite`
  content relevant to the moved agents (scope TBD — see Open questions), and
  a new `README.md` explaining how Spec → Plan → Implement → Verify fits
  together (based on `.claude/agents/README.md`'s lifecycle diagram, stripped
  of `test-writer`/`doc-writer`/DevDigest specifics not carried over).
- Skills are invoked through the dependency's **namespace**:
  `engineering-paved-path:react-best-practices`, never a bare skill name —
  this is what lets `implementer`/`implementation-planner` keep routing
  skills by file-type without assuming they're preloaded into the same
  plugin.
- DevDigest paths (`server/INSIGHTS.md`, `docs/plan/`, `specs/SPEC-NN-*.md`)
  are replaced with **explicit inputs** the agent is given at invocation time
  (e.g. "which directory holds specs", "which directory holds plans") rather
  than assumed conventions.
- Any skill with a `scripts/`/`assets/` subfolder (e.g. `typescript-expert/scripts`,
  `zod/assets/templates`) is addressed via `${CLAUDE_SKILL_DIR}` at runtime,
  never a hardcoded `.claude/skills/<name>/` path — required because plugins
  are copied into `~/.claude/plugins/cache` on install (see
  [`docs/PLUGIN-GUIDELINES.md`](../PLUGIN-GUIDELINES.md#paths-the-cache-rule)).

## File layout (per plugin, following existing guidelines)

```
plugins/
├── engineering-paved-path/
│   ├── .claude-plugin/plugin.json
│   ├── skills/
│   │   ├── react-best-practices/SKILL.md
│   │   ├── react-component-architecture/SKILL.md   # generalized
│   │   ├── react-testing-library/SKILL.md
│   │   ├── security/SKILL.md
│   │   ├── mermaid-diagram/SKILL.md
│   │   └── layered-architecture/SKILL.md           # generalized onion-architecture
│   └── CHANGELOG.md
├── research-tools/
│   ├── .claude-plugin/plugin.json
│   ├── agents/researcher.md
│   └── CHANGELOG.md
├── architecture-review/
│   ├── .claude-plugin/plugin.json
│   ├── agents/architecture-reviewer.md             # generalized
│   └── CHANGELOG.md
└── sdd-engineering/
    ├── .claude-plugin/plugin.json                  # dependencies: the 3 above
    ├── agents/
    │   ├── spec-creator.md
    │   ├── implementation-planner.md
    │   ├── implementer.md
    │   └── plan-verifier.md
    ├── skills/
    │   ├── run-plan/SKILL.md                       # was implement-plan
    │   └── retro/SKILL.md                          # was workflow-retro
    ├── README.md                                   # lifecycle explainer
    └── CHANGELOG.md
```

Each `plugin.json` carries its own `name`, `version` (starts at `1.0.0`),
`description`, `author` — no shared manifest. `CHANGELOG.md` is the
"versions and releases" file per plugin, per
[`docs/PLUGIN-GUIDELINES.md`](../PLUGIN-GUIDELINES.md#changelog) — dated
entries, one per release. This satisfies the "README + versions/releases
file" requirement per plugin; there's no separate top-level "releases" file
beyond what `docs/RELEASES.md` already documents for the whole marketplace.

## Registering in `marketplace.json` (Step 5)

Four new entries appended to `.claude-plugin/marketplace.json`'s `plugins[]`
array — `name`, `source: "./plugins/<name>"`, `description`, `category`, no
`version` (forbidden in the catalog entry, lives in `plugin.json` only, per
[`docs/RELEASES.md`](../RELEASES.md)). Plus, if the third-party-skills
decision above is confirmed, one catalog entry per vendored skill
(`fastify-best-practices`, `next-best-practices`, `typescript-expert`, …),
each pinned `ref` + full 40-char `sha`, `author` crediting the origin repo —
same shape as the worked example already in
[`docs/PLUGIN-GUIDELINES.md`](../PLUGIN-GUIDELINES.md#third-party-skills).

## Decisions (previously open questions — all resolved)

1. **Third-party skill sourcing**: `engineering-paved-path` bundles only
   first-party skills; vendored ones (`fastify-best-practices`,
   `next-best-practices`, `typescript-expert`, `postgresql-table-design`,
   `drizzle-orm-patterns`) become their own third-party `marketplace.json`
   entries and are pulled in via `engineering-paved-path`'s `dependencies`.
2. **Generalization depth**: full framework-agnostic rewrite for
   `architecture-reviewer`, `onion-architecture`, and
   `react-component-architecture` — module maps become runtime input, not
   hardcoded tables. Real rewrite work, not a mechanical move.
3. **Evals**: `evals/agents/architecture-reviewer*` stay in `dev-digest` for
   now — not carried into `architecture-review`. Revisit once the
   generalized agent needs its own test harness.
4. **Cross-plugin skill namespacing**: confirmed against the official docs
   ([plugin-dependencies](https://code.claude.com/docs/en/plugin-dependencies),
   [sub-agents](https://code.claude.com/docs/en/sub-agents),
   [skills](https://code.claude.com/docs/en/skills)) — a dependency
   plugin's skills are namespaced `<plugin-name>:<skill-name>` and any
   sub-agent can load them via the `Skill` tool at runtime as long as the
   dependency is installed (`sub-agents can still access other project,
   user, or plugin skills through the Skill tool unless specifically
   restricted`). No content duplication needed; `sdd-engineering`'s agents
   reference `engineering-paved-path:react-best-practices` etc. by name.

## Verification plan

- `node scripts/validate-marketplace.mjs` and `claude plugin validate .`
  after the four entries are added.
- `claude plugin validate ./plugins/<name> --strict` per plugin.
- Install locally (`claude plugin marketplace add ./`, `claude plugin install
  sdd-engineering@seasoned-ai-marketplace`) and actually invoke
  `spec-creator`, `run-plan`, and confirm `sdd-engineering:run-plan` can call
  a skill from `engineering-paved-path` by namespace.
