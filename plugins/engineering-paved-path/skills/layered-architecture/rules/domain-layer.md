# Domain Layer

The innermost layer. Contains the **language of the business** — no I/O, no
framework, no infrastructure concern.

## What Lives Here

| Artifact | Location | Example |
|----------|----------|---------|
| Entity types | shared contracts package or `modules/<feature>/types.ts` | `Agent`, `Order`, `Finding` |
| Value objects | same | `Severity`, `Status` (schema-validated enums) |
| Validated contracts | shared contracts package | request/response shapes used by both application and presentation layers |
| Port interfaces | `modules/<feature>/types.ts` or the shared contracts package | `IFeatureRepository`, `NotificationSender` |
| Domain errors | a shared `errors.ts` | `NotFoundError`, `ConflictError` |

## Defining a Port Interface

A **port** is an interface that defines what the application layer needs
from the outside world. The infrastructure layer provides a concrete
implementation.

```ts
// modules/notifications/types.ts — domain layer
export interface NotificationSender {
  send(to: string, message: string): Promise<void>;
}
```

The application service depends on `NotificationSender`, not on any concrete
mailer/provider.

## Schemas as the Domain Language

Schema-validation-library definitions in the shared contracts package ARE the
domain model. They define canonical shapes that both the service layer and
the HTTP layer validate against. Keep them framework-agnostic — no ORM types,
no web-framework types:

```ts
// contracts/findings.ts (illustrative — substitute your validation library)
export const Severity = /* enum(['critical', 'high', 'medium', 'low', 'info']) */;
export type Severity = /* inferred type */;

export const Finding = /* object({ id, severity, message }) */;
export type Finding = /* inferred type */;
```

## Rules

- Domain types must not import from the ORM, the web framework, external SDKs, or any adapter
- Schemas that cross the HTTP boundary belong in the shared contracts package; schemas used only internally can live in `modules/<feature>/schemas.ts`
- Enums go through the schema library so they're validated at both the data-store and HTTP boundaries
- Domain errors are the only "framework" concept allowed — they become framework-aware only at the presentation layer, where they get mapped to HTTP status codes
