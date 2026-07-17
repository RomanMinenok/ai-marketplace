---
description: Step-by-step refactoring of the selected React component with a change preview.
tools: [Read, Edit, Grep]
invocation: /refactor
---

The skill accepts a path to a component or the currently open file. It first builds an AST and identifies the boundaries of logical blocks.

Then it proposes a plan: extracting subcomponents, lifting state, replacing classes with functions and hooks. Each step is shown as a diff before being applied.
