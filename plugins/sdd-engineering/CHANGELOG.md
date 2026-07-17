# Changelog

## 1.0.0 — 2026-07-17
- Initial release: Spec-Driven Development agent pipeline (`spec-creator`,
  `implementation-planner`, `implementer`, `plan-verifier`) + `run-plan`
  skill (orchestrates Implement → Verify → Review) + `retro` skill
  (post-run pipeline analysis).
- Generalized from a project-specific agent set: the hardcoded 5-package
  module table and stack-specific skills matrix were replaced with
  runtime-determined module maps and a stack-adaptable skills-routing
  table. `test-writer`, `doc-writer`, and `architecture-reviewer-lite` were
  not carried over.
- Depends on `engineering-paved-path`, `research-tools`, and
  `architecture-review` (each `^1.0.0`).
