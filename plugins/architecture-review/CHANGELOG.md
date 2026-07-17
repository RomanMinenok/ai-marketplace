# Changelog

## 1.0.0 — 2026-07-17
- Initial release: framework-agnostic `architecture-reviewer` agent, generalized from DevDigest's `architecture-reviewer` (which hardcoded a fixed 5-package Onion-architecture layout). The module/layer map is now a runtime input — inferred from the caller's prompt, a convention file in the target repo, or a short exploration pass — instead of assumed. The 7-category checklist (dependency rule, layer boundaries, coupling/cohesion, cycles, anemic domain, leaky ports, pattern consistency) and the severity+confidence findings format carry over unchanged.
- Depends on `engineering-paved-path` (`^1.0.0`) for its `layered-architecture`, `react-component-architecture`, and `mermaid-diagram` skills.
