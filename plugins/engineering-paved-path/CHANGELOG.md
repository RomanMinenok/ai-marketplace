# Changelog

## 1.0.0 — 2026-07-17
- Initial release. First-party skills, generalized to be framework/stack-agnostic:
  - `react-best-practices` — modern React conventions and anti-patterns
  - `react-testing-library` — React Testing Library + Vitest guide
  - `react-component-architecture` — generalized from a Next.js+Mantine-specific
    version: framework/styling-solution assumptions replaced with substitutable
    placeholders
  - `security` — OWASP Top 10 web application security guidance
  - `mermaid-diagram` — Mermaid diagram authoring guide
  - `layered-architecture` — generalized from a project-specific Onion
    Architecture skill hardcoded to one backend's file layout: layer→file
    mapping is now illustrative, not assumed
- Pulls in `fastify-best-practices`, `next-best-practices`, `typescript-expert`,
  `postgresql-table-design`, `drizzle-orm-patterns` as third-party
  `dependencies` (each a separate catalog entry, vendored from its own
  upstream repository) rather than bundling their content directly.
