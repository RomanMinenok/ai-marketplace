# React Tools

React Tools is a collection of tools for working with React code in Claude Code. The plugin is aimed at large codebases, where manual refactoring is expensive.

The main `/refactor` skill analyzes the selected component, proposes safe decomposition steps, and applies them with a diff preview.

The `react-analyzer` agent builds a map of component dependencies and highlights problem areas: unnecessary re-renders, prop drilling, hook anti-patterns.
