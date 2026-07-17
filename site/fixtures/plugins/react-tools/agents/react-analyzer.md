---
description: Agent that builds a map of components and dependencies in the project.
tools: [Read, Grep, Glob]
model: claude-sonnet
---

react-analyzer scans the src directory, builds a component import graph, and identifies re-render hotspots.

Used as context for other skills or on its own for code review.
