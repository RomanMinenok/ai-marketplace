---
name: react-component-architecture
description: "Structural and organizational decisions for React components — framework-agnostic (works with Next.js, Remix, Vite, CRA, or any React setup; styling approach — CSS Modules, CSS-in-JS, a component library — is a substitutable detail, not a prerequisite). Use when deciding how to split components, where to put constants/utils/styles/hooks, how to separate business logic, or how to organize a new feature folder. Covers decomposition rules, file layout, co-location, TypeScript prop patterns. Complements react-best-practices (which covers API misuse rules) and any framework-specific routing/data-fetching skill (App Router/RSC, Remix loaders, etc.) you load alongside it."
metadata:
  tags: react, architecture, components, structure, organization, typescript
  version: "1.0.0"
---

# React Component Architecture

Structural decisions for a React + TypeScript codebase, independent of which
meta-framework or styling solution the project uses. Substitute your own
routing convention (`app/`, `pages/`, `routes/`) and styling approach
(CSS Modules, CSS-in-JS, a component library, plain CSS) where this doc says
"styles" or "route" — the organizational rules below don't depend on the
choice.

## Severity Levels

- **CRITICAL** — Wrong structure will cause coupling, circular imports, or maintainability collapse
- **HIGH** — Wrong choice will create hidden bugs or make the code hard to change
- **MEDIUM** — Affects developer experience and consistency

## Related Skills

| Skill | What It Covers | When to Use Instead |
|-------|----------------|---------------------|
| `react-best-practices` | React API misuse: hooks rules, state anti-patterns, render bugs | You're reviewing component logic, not structure |
| A framework-specific routing/data-fetching skill (App Router/RSC, Remix, etc.) | Server/client component boundaries, data-fetching patterns | You're working with route files, layouts, or server components |
| A TypeScript-focused skill | Advanced type-level programming | You need generics/conditional types beyond prop shapes |

---

## Feature Folder Structure (CRITICAL)

Every feature component lives in its own folder. The folder is the
encapsulation unit.

```
components/<feature>/
  ComponentName.tsx   ← main component file, PascalCase matches folder name
  constants.ts        ← magic values, enums, thresholds
  helpers.ts          ← pure functions used by the component
  styles.ts           ← co-located style definitions (whatever your styling approach is)
  hooks/              ← hooks subfolder when there are 2+ hooks
    useFeatureThing.ts
    index.ts
  SubPart/            ← sub-components get their own subfolder
    SubPart.tsx
    index.ts
  index.ts            ← public barrel: re-exports the main component only
```

Rules:
- The folder name is the feature name (camelCase). The file name is PascalCase.
- `index.ts` **only re-exports the main component** — never leak internals through it.
- Route-local components live next to the route (e.g. `app/<route>/_components/`
  or your framework's equivalent) — promote to a shared `components/` root
  only when reused in a second route.
- Shared components used by 3+ features go in the shared `components/` root.

## Where Code Lives — Decision Matrix (CRITICAL)

| Code type | Location |
|-----------|----------|
| Magic numbers, regex, thresholds, label strings | `components/<feature>/constants.ts` |
| Pure functions: parsing, formatting, sorting | `components/<feature>/helpers.ts` |
| Style definitions (whatever your styling approach is) | `components/<feature>/styles.ts` |
| Hooks specific to one feature | `components/<feature>/hooks/useX.ts` |
| Shared hooks used by 2+ features | `lib/hooks/<domain>.ts` |
| All calls to your backend/API | one central API-client module — never scatter fetch calls across components |
| Shared types | `lib/types.ts` or a domain-specific type file next to its hooks |
| Theme overrides | your styling solution's theme entrypoint |
| Providers / context | `lib/providers.tsx` or `lib/<name>-context.tsx` |

## Business Logic → Hooks, Not Components (CRITICAL)

A component body must only: compute display values, map state to JSX, and
call handlers. Everything else belongs in a custom hook.

Extract to a hook when:
- The logic involves `useEffect`, `useMemo`, or `useReducer`
- The logic manages >1 related state variables
- The logic is testable independently of rendering
- The logic would repeat across 2+ components

Hook files (`use<Name>.ts`) must:
- Live in the component's `hooks/` subfolder (feature-scoped) or `lib/hooks/`
  (shared)
- Export one default hook per file
- Type the return value explicitly with a named interface
- Use a server-state library (e.g. React Query / SWR) for anything fetched
  from your backend, rather than hand-rolled `useEffect` fetch logic

## Constants in Separate Files (HIGH)

Extract to `constants.ts` when:
- A value is used in more than one place within the component
- A value has a non-obvious meaning (threshold, timeout, regex)
- A value may change independently of component logic

Keep inline when:
- It's a one-off literal used exactly once and the meaning is obvious from context
- It's a JSX string that is clearly UI copy

Naming conventions:
```ts
// SCREAMING_SNAKE_CASE for module-level constants
export const AUTO_EXPAND_MAX_LINES = 200;
export const HUNK_HEADER_RE = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;
export const NAV_TIMEOUT_MS = 800;
```

## Styles in Separate Files (MEDIUM)

Whatever your styling approach — a typed style-object convention, CSS
Modules, or a component library's style props — co-locate it in `styles.ts`
(or `Component.module.css` if using CSS Modules):

```ts
// styles.ts (typed style-object example — adapt to CSS Modules/CSS-in-JS as needed)
import type { CSSProperties } from "react";
export const s = {
  list: { display: "flex", flexDirection: "column", gap: 10 } satisfies CSSProperties,
  header: { padding: "10px 12px", cursor: "pointer" } satisfies CSSProperties,
} as const;
```

Rules:
- Name the export `s` for brevity (used as `s.list`, `s.header` in JSX) if
  using the typed style-object pattern
- Dynamic styles (depending on props/state) → export as small pure
  functions in `styles.ts`, not inline
- Never inline `style={{}}` object literals in JSX — they create a new
  object reference on every render

## Helpers (Pure Utils) vs Hooks (MEDIUM)

| `helpers.ts` | `hooks/useX.ts` |
|---|---|
| No React imports | Uses `useState`, `useEffect`, etc. |
| Pure functions: input → output | May have side effects / subscriptions |
| Synchronous | May be async |
| Testable without a component-rendering library | Needs `renderHook` to test |

Do not put business logic in `helpers.ts` — it is for transformation and
formatting only. Do not put React state or effects in `helpers.ts`.

## Component Decomposition — When to Split (HIGH)

Split a component into sub-components when ANY of these is true:
- The component exceeds ~150 lines
- A section of JSX can be named meaningfully on its own
- A section has its own local state
- The same JSX block appears more than once

Sub-components go in their own `SubName/SubName.tsx` subfolder within the
feature folder.

**Container / Presenter split** (mandatory for data-fetching components):
- Container = fetches data via hooks, handles loading/error/empty states,
  renders nothing visual
- Presenter = receives typed props, renders UI, has no hooks except
  formatting helpers

```tsx
// FeatureDetail.tsx (container) — fetches, guards
const { data, isLoading, error } = useFeatureData(id);
if (isLoading) return <Loader />;
if (error) return <ErrorState />;
return <FeatureDetailView data={data} />;

// FeatureDetailView.tsx (presenter) — only renders
interface FeatureDetailViewProps { data: FeatureRecord[] }
function FeatureDetailView({ data }: FeatureDetailViewProps) { ... }
```

## TypeScript Prop Patterns (HIGH)

### Prop interface naming
```ts
// Always name the interface <ComponentName>Props — no anonymous types in JSX
interface DiffViewerProps {
  files: FileDiff[];
  onFileClick?: (path: string) => void;
}
```

### Discriminated unions for variant components
```ts
// BAD: optional props that are only valid together
interface BadProps {
  mode?: 'view' | 'edit';
  onSave?: () => void;  // only makes sense in edit mode
}

// GOOD: discriminated union enforces consistency at compile time
type GoodProps =
  | { mode: 'view' }
  | { mode: 'edit'; onSave: () => void };
```

### Avoid prop explosion
- More than 5-6 props → either the component does too much, or group
  related props into a sub-object
- Prefer accepting a domain object (`review: ReviewRecord`) over 6
  individual fields

## API Layer (CRITICAL)

All backend calls go through one central API-client module. Never import
`fetch`/`axios` directly in a component or hook — call the shared client
(`api.get()`, `api.post()`, `api.del()`, or your equivalent).

- Server-state hooks (`useQuery`, `useMutation` from React Query/SWR/etc.)
  are the standard wrapper around that client
- `queryKey` arrays must be `["resource-type", id]` — consistent so cache
  invalidation works
- Streaming (SSE/WebSocket) connections open inside a `useEffect` in a hook
  (not directly in a component)

## File Order Convention (MEDIUM)

Within any `.tsx` or `.ts` file:
1. Framework-specific directive (e.g. `"use client"`), if needed
2. External imports (react, framework, UI library, data-fetching library)
3. Internal imports (`../lib/`, `./helpers`)
4. Types / interfaces
5. Module-level constants
6. Component(s) or hook(s)
7. Named exports (no default exports for components — use named)
