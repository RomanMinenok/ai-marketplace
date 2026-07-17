---
name: layered-architecture
version: 1.0.0
description: "Enforces Onion/Hexagonal (Ports & Adapters) layered architecture for a new backend module in any stack. Use when scaffolding a new backend module, adding a feature to an existing one, deciding where a piece of logic belongs, or reviewing cross-layer dependencies. Maps the four layers (Domain → Application → Infrastructure → Presentation) to generic concepts — a domain/contracts layer, a service layer, a repository/adapter layer, a route/controller layer, and a composition root — that you adapt to your own framework, ORM, and validation library. Trigger terms: new module, backend feature, where does this code go, layer boundary, onion architecture, clean architecture, hexagonal, ports and adapters, repository pattern, use case, application service, DI container."
metadata:
  tags: architecture, backend, onion, hexagonal, clean-architecture, ddd, typescript
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Layered Architecture (Onion / Hexagonal / Ports & Adapters)

> Version 1.0.0 — framework-agnostic. Examples use generic placeholders
> (`<Framework>` for the web framework, `<ORM>` for the data-access library,
> `<Schema>` for the validation library) — substitute your project's actual
> tools; the layering rule itself doesn't change.

Dependencies always point **inward**. Outer layers know about inner layers;
inner layers know nothing about outer layers.

```
┌─────────────────────────────────────────────────┐
│  Presentation  (routes/controllers — <Framework>)│  ← outermost
│  ┌───────────────────────────────────────────┐  │
│  │  Infrastructure  (repository — <ORM>,     │  │
│  │                   adapters/ — external    │  │
│  │                   APIs, LLMs, queues)     │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Application  (service — use cases) │  │  │
│  │  │  ┌───────────────────────────────┐  │  │  │
│  │  │  │  Domain (contracts, entities, │  │  │  │
│  │  │  │          port interfaces)     │  │  │  │
│  │  │  └───────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
              composition root = DI wiring only
```

## Layer → Concept Mapping

| Layer | Typical file(s) | Concern |
|-------|---------|-------|
| **Domain** | `types.ts` / shared contracts package | entities, value objects, port interfaces, validated schemas — zero framework imports |
| **Application** | `service.ts` | use cases, orchestration, domain invariants, no I/O |
| **Infrastructure** | `repository.ts`, `adapters/*` | data access (`<ORM>`), external SDKs — the only layer that touches I/O |
| **Presentation** | `routes.ts` / controller | HTTP verbs, request/response validation (`<Schema>`), maps HTTP ↔ service calls |
| **Composition root** | `container.ts` | the one file allowed to see every layer — wires ports to concrete adapters |

Adapt the concrete filenames to your project's convention; keep the layer
*roles* intact.

## The Golden Rule

```
route/controller → service → port interface → repository / adapter
```

No arrow ever points outward. If you find yourself importing the web
framework inside a service, or the ORM inside a route, a layer boundary has
been crossed.

## Recommended Reading

- [rules/layers.md](rules/layers.md) — dependency rules and import guards
- [rules/domain-layer.md](rules/domain-layer.md) — entities, contracts, port interfaces
- [rules/application-layer.md](rules/application-layer.md) — service patterns (use cases)
- [rules/infrastructure-layer.md](rules/infrastructure-layer.md) — repository, adapters
- [rules/presentation-layer.md](rules/presentation-layer.md) — routes, request/response validation
- [rules/di-container.md](rules/di-container.md) — composition root, overrides for tests
- [rules/anti-patterns.md](rules/anti-patterns.md) — what NOT to do and why

## New Module Checklist

When scaffolding a new backend module:

- [ ] Define domain types/contracts in the shared contracts package or a local `types.ts`
- [ ] Write port interface(s) the service depends on (e.g. `IFeatureRepository`)
- [ ] Implement the service depending only on port interfaces + domain types
- [ ] Implement the repository, implementing the port interface via your ORM/data layer
- [ ] Register the repository on the composition root / DI container
- [ ] Implement the route/controller importing only from the service + shared contracts
- [ ] Run your type-checker — zero cross-layer leakage = passes
