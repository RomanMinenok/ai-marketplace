---
description: MCP-сервер з інструментами query, schema та explain-plan.
tools: [query, schema, explain-plan]
---

Сервер підключається за DATABASE_URL і експонує інструменти для інспекції схеми та безпечних SELECT-запитів.

Усі запити проходять через whitelist і ліміт рядків.
