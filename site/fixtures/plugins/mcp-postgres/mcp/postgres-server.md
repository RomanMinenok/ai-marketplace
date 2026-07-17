---
description: MCP server with query, schema, and explain-plan tools.
tools: [query, schema, explain-plan]
---

The server connects via DATABASE_URL and exposes tools for schema inspection and safe SELECT queries.

All queries pass through a whitelist and a row limit.
